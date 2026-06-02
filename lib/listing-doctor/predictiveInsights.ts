import { getComparablePastListings, MOCK_PAST_LISTING_COUNT } from "./pastListings";
import type {
  FixRecommendation,
  ListingDraft,
  PredictiveConfidence,
  PredictiveInsights,
  PricingFeedback,
  ScoreSet,
} from "./types";

type PredictiveInput = {
  scores: ScoreSet;
  pricingFeedback: PricingFeedback;
  buyerQuestions: string[];
  photoImprovements: string[];
  descriptionFeedback: string[];
  topFixes: FixRecommendation[];
};

export function buildPredictiveInsights(
  listing: ListingDraft,
  input: PredictiveInput,
): PredictiveInsights {
  const comparables = getComparablePastListings(listing);
  const successfulComparables = comparables.filter((item) => item.successful);
  const comparisonSample = successfulComparables.length ? successfulComparables : comparables;
  const leadProbabilityScore = clampScore(
    input.scores.overall * 0.36 +
      input.scores.trust * 0.2 +
      input.scores.photoCompleteness * 0.16 +
      input.scores.descriptionQuality * 0.14 +
      input.scores.searchability * 0.08 +
      (input.scores.marketPosition ?? 50) * 0.06,
  );
  const leadLiftRange = estimateLeadLift(input.topFixes, input.scores.overall);
  const avgDaysToSell = Math.round(average(comparisonSample.map((item) => item.daysToSell)) || 0);
  const expectedDaysToSell = Math.max(
    5,
    Math.round(avgDaysToSell * (leadProbabilityScore >= 80 ? 0.82 : leadProbabilityScore >= 60 ? 1 : 1.22)),
  );
  const highQualityLeadAvg = Math.round(
    average(comparables.filter((item) => item.qualityScore >= 85).map((item) => item.leadCount)) || 0,
  );
  const avgContactRate = average(successfulComparables.map((item) => item.contactRate)) || 0;
  const avgSeasonality = average(comparables.map((item) => item.seasonalityIndex)) || 1;
  const avgListingAge = Math.round(average(comparables.map((item) => item.listingAgeDays)) || 0);
  const avgResponseTime = Math.round(average(comparables.map((item) => item.sellerResponseTimeHours)) || 0);
  const dealerShare = Math.round(
    (comparables.filter((item) => item.sellerType === "dealer").length / Math.max(1, comparables.length)) * 100,
  );

  return {
    mode: "simulated-ml",
    comparableCount: comparables.length,
    benchmarkUniverseSize: MOCK_PAST_LISTING_COUNT,
    confidence: confidenceFromComparableCount(comparables.length),
    leadProbabilityScore,
    expectedLeadImpact: `+${leadLiftRange.low}% to +${leadLiftRange.high}%`,
    leadLiftRange,
    expectedTimeToFirstContact: timeToFirstContact(leadProbabilityScore),
    expectedDaysToSell,
    priceCompetitiveness: priceCompetitiveness(input.pricingFeedback.position),
    descriptionQualityPrediction: descriptionPrediction(input.scores.descriptionQuality),
    photoCoveragePrediction: photoPrediction(input.scores.photoCompleteness),
    likelyBuyerObjections: buildLikelyBuyerObjections(listing, input).slice(0, 5),
    performanceSignals: [
      `Simulated from ${successfulComparables.length} successful synthetic comparable listings out of ${comparables.length} matched local records.`,
      highQualityLeadAvg
        ? `High-quality synthetic comparables averaged ${highQualityLeadAvg} buyer leads.`
        : "The synthetic comparable sample has limited high-quality lead history.",
      avgContactRate
        ? `Successful synthetic comparables averaged ${(avgContactRate * 100).toFixed(1)}% contact rate.`
        : "Contact-rate history is limited in this synthetic comparable sample.",
      `Comparable demand seasonality index averages ${avgSeasonality.toFixed(2)} for this segment.`,
      avgListingAge ? `Comparable listings average ${avgListingAge} days online in the synthetic history.` : "",
      avgResponseTime ? `Seller response behavior averages ${avgResponseTime} hours; dealer share is ${dealerShare}%.` : "",
      avgDaysToSell
        ? `Sold synthetic comparables averaged ${avgDaysToSell} days online.`
        : "No sold synthetic comparables were available for this segment.",
      `Price competitiveness is ${priceCompetitiveness(input.pricingFeedback.position).toLowerCase()} under the mocked benchmark model.`,
    ],
  };
}

function buildLikelyBuyerObjections(listing: ListingDraft, input: PredictiveInput) {
  const objections = [...input.buyerQuestions];

  if (listing.mfkStatus !== "valid") {
    objections.push("Is the MFK valid, and what work is needed for inspection?");
  }

  if (listing.serviceHistoryStatus !== "complete") {
    objections.push("Can the seller prove maintenance with invoices or a service book?");
  }

  if (listing.accidentHistoryStatus === "unknown") {
    objections.push("Has the vehicle had accident damage?");
  }

  if (/diesel/i.test(listing.fuelType) && listing.mileageKm >= 140000) {
    objections.push("How has the high-mileage diesel powertrain been maintained?");
  }

  if (input.photoImprovements.some((item) => /odometer|tyre|dashboard|service/i.test(item))) {
    objections.push("Can the seller provide missing proof photos before viewing?");
  }

  if (input.pricingFeedback.position === "above") {
    objections.push("What justifies the premium versus similar vehicles?");
  } else if (input.pricingFeedback.position === "below") {
    objections.push("Why is the price below comparable vehicles?");
  }

  if (input.descriptionFeedback.length) {
    objections.push("Does the description provide enough proof, or only general claims?");
  }

  return dedupe(objections);
}

function estimateLeadLift(topFixes: FixRecommendation[], overallScore: number) {
  const rawLift = topFixes.reduce((sum, fix) => sum + fix.scoreLift, 0);
  const opportunity = Math.max(4, Math.min(28, Math.round(rawLift * 0.9 + (100 - overallScore) * 0.08)));
  const low = Math.max(2, Math.round(opportunity * 0.55));
  const high = Math.max(low + 2, Math.round(opportunity));

  return { low, high };
}

function confidenceFromComparableCount(count: number): PredictiveConfidence {
  if (count >= 80) return "High";
  if (count >= 24) return "Medium";
  return "Low";
}

function timeToFirstContact(score: number) {
  if (score >= 82) return "Likely within 24 hours";
  if (score >= 62) return "Likely within 1-3 days";
  return "Likely 3-7 days unless fixes are made";
}

function priceCompetitiveness(position: PricingFeedback["position"]) {
  if (position === "within") return "Strong";
  if (position === "below") return "Neutral";
  return "Weak";
}

function descriptionPrediction(score: number): PredictiveInsights["descriptionQualityPrediction"] {
  if (score >= 78) return "Strong";
  if (score >= 55) return "Needs proof";
  return "Weak";
}

function photoPrediction(score: number): PredictiveInsights["photoCoveragePrediction"] {
  if (score >= 82) return "Complete";
  if (score >= 55) return "Needs proof";
  return "Incomplete";
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampScore(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function dedupe(items: string[]) {
  return Array.from(new Set(items));
}
