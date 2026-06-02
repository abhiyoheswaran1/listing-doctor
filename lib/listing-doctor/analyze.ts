import {
  photoChecklistItems,
  type FixRecommendation,
  type ImpactLevel,
  type ListingAnalysis,
  type ListingDraft,
  type PhotoChecklist,
  type PricingFeedback,
  type ScoreBreakdownItem,
} from "./types";
import { getComparablePastListings, MOCK_PAST_LISTING_COUNT } from "./pastListings";
import { buildPredictiveInsights } from "./predictiveInsights";
import { buildPriceBenchmark } from "./pricing";

type DraftIssue = FixRecommendation & {
  category:
    | "vehicle"
    | "trust"
    | "description"
    | "photos"
    | "search"
    | "pricing"
    | "equipment"
    | "technical"
    | "battery";
};

const impactRank: Record<ImpactLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export function analyzeListing(listing: ListingDraft): ListingAnalysis {
  const normalizedText = normalizeText(
    `${listing.description} ${listing.sellerNotes ?? ""} ${listing.keyFeatures.join(" ")} ${(listing.standardEquipment ?? []).join(" ")} ${(listing.optionalEquipment ?? []).join(" ")}`,
  );
  const descriptionText = normalizeText(listing.description);
  const wordCount = countWords(listing.description);
  const isElectric = /electric|ev|tesla/i.test(
    `${listing.fuelType} ${listing.make} ${listing.model}`,
  );
  const isDieselHighMileage =
    /diesel/i.test(listing.fuelType) && listing.mileageKm > 140000;
  const urgentLanguage = hasUrgencyLanguage(normalizedText);

  const fixes: DraftIssue[] = [];
  const missingTrustSignals: string[] = [];
  const photoImprovements: string[] = [];
  const descriptionFeedback: string[] = [];
  const searchabilityImprovements: string[] = [];
  const buyerQuestions: string[] = [];

  let trust = 100;
  let descriptionQuality = 100;
  let searchability = 100;
  let hasMajorDescriptionIssue = false;
  const scoreBreakdown: ScoreBreakdownItem[] = [];

  const addFix = (
    category: DraftIssue["category"],
    title: string,
    detail: string,
    impact: ImpactLevel,
    scoreLift: number,
  ) => {
    fixes.push({ category, title, detail, impact, scoreLift });
  };

  if (listing.mfkStatus === "missing" || listing.mfkStatus === "unknown") {
    trust -= 28;
    missingTrustSignals.push("Valid MFK date or a clear explanation if MFK is not available");
    buyerQuestions.push("Does the car have a valid MFK, and when was it last inspected?");
  } else if (listing.mfkStatus === "expired") {
    trust -= 18;
    missingTrustSignals.push("Updated MFK status or inspection appointment");
    buyerQuestions.push("What work is needed before the next MFK?");
  }

  if (listing.serviceHistoryStatus === "unknown") {
    trust -= 18;
    missingTrustSignals.push("Service history status with invoices or service book photos");
    buyerQuestions.push("Can the seller prove regular maintenance?");
  } else if (listing.serviceHistoryStatus === "missing") {
    trust -= 22;
    missingTrustSignals.push("Maintenance explanation for the missing service history");
    buyerQuestions.push("Why is the service history missing?");
  } else if (listing.serviceHistoryStatus === "partial") {
    trust -= 8;
    missingTrustSignals.push("Dates and mileage for the available service records");
  }

  if (listing.accidentHistoryStatus === "unknown") {
    trust -= 20;
    missingTrustSignals.push("Clear accident history statement");
    buyerQuestions.push("Has the vehicle ever had accident damage?");
  } else if (listing.accidentHistoryStatus === "repaired") {
    trust -= 8;
    missingTrustSignals.push("Repair documentation and photos for previous damage");
    buyerQuestions.push("Which repairs were completed, and by whom?");
  } else if (listing.accidentHistoryStatus === "has-damage") {
    trust -= 12;
    missingTrustSignals.push("Transparent photos and description of current defects");
    buyerQuestions.push("What damage remains and what would it cost to repair?");
  }

  if (listing.warrantyStatus === "none") {
    trust -= listing.sellerType === "dealer" ? 14 : 9;
    missingTrustSignals.push("Warranty status or sold-as-seen disclosure");
  } else if (listing.warrantyStatus === "unknown") {
    trust -= 10;
    missingTrustSignals.push("Warranty status");
  }

  if (urgentLanguage) {
    trust -= 10;
    descriptionQuality -= 12;
    descriptionFeedback.push("Remove urgency language such as must sell quickly; it creates negotiation pressure.");
    addFix(
      "description",
      "Replace urgency language with factual availability",
      "Buyers read urgent wording as a warning sign. State viewing availability and handover timing instead.",
      "Medium",
      7,
    );
  }

  if (isDieselHighMileage) {
    trust -= 6;
    descriptionQuality -= includesAny(descriptionText, ["service", "maintenance", "injector", "turbo", "mfk"])
      ? 0
      : 8;
    buyerQuestions.push("How has the high-mileage diesel powertrain been maintained?");
    searchabilityImprovements.push("Address high-mileage diesel maintenance directly.");
  }

  if (isElectric) {
    const mentionsBattery =
      includesAny(normalizedText, ["battery warranty", "battery health", "soh", "range"]) ||
      listing.warrantyStatus === "battery warranty" ||
      listing.warrantyStatus === "manufacturer warranty";
    const mentionsChargingCable = includesAny(normalizedText, [
      "charging cable",
      "wallbox",
      "type 2",
      "supercharger",
    ]);

    if (!mentionsBattery) {
      trust -= 10;
      descriptionQuality -= 8;
      missingTrustSignals.push("Battery warranty or battery health information");
      buyerQuestions.push("What battery warranty remains and what is the battery health?");
      addFix(
        "trust",
        "Add EV battery warranty information",
        "EV buyers need battery warranty, battery health, and realistic range context before they enquire.",
        "High",
        11,
      );
    }

    if (!mentionsChargingCable) {
      searchability -= 8;
      searchabilityImprovements.push("Mention included charging cables or charging equipment.");
      buyerQuestions.push("Which charging cables are included?");
    }
  }

  if (missingTrustSignals.length > 0) {
    addFix(
      "trust",
      "Prove MFK, service history, and accident status",
      "Add the missing trust evidence before publishing. These are the fastest signals for reducing buyer doubt.",
      "High",
      Math.min(24, 12 + missingTrustSignals.length * 3),
    );
  }

  if (wordCount < 12) {
    hasMajorDescriptionIssue = true;
    descriptionQuality -= 35;
    descriptionFeedback.push("The description is too short to answer basic buyer concerns.");
  } else if (wordCount < 30) {
    if (wordCount < 20) hasMajorDescriptionIssue = true;
    descriptionQuality -= 18;
    descriptionFeedback.push("The description needs more specific vehicle, condition, and ownership detail.");
  } else if (wordCount < 60) {
    descriptionQuality -= 10;
    descriptionFeedback.push("The description is solid, but it can still add a few buyer-proof details.");
  }

  const vaguePhraseCount = countMatchedPhrases(descriptionText, [
    "good car",
    "nice car",
    "top condition",
    "runs well",
    "all good",
    "call me",
    "must see",
  ]);
  if (vaguePhraseCount > 0) {
    hasMajorDescriptionIssue = true;
    descriptionQuality -= Math.min(20, vaguePhraseCount * 8);
    descriptionFeedback.push("Replace vague claims with proof: service dates, condition notes, included equipment.");
  }

  const trustWordingPresent = includesAny(descriptionText, [
    "mfk",
    "service history",
    "service book",
    "accident-free",
    "warranty",
    "invoice",
    "documented",
    "maintained",
  ]);
  if (!trustWordingPresent) {
    hasMajorDescriptionIssue = true;
    descriptionQuality -= 12;
    descriptionFeedback.push("Add trust-building wording around MFK, accident status, service history, or warranty.");
  }

  const equipmentCount =
    listing.keyFeatures.length +
    (listing.standardEquipment?.length ?? 0) +
    (listing.optionalEquipment?.length ?? 0);

  if (equipmentCount === 0) {
    descriptionQuality -= 10;
    searchability -= 30;
    searchabilityImprovements.push("Confirm standard equipment and select only the optional equipment this vehicle actually has.");
    addFix(
      "search",
      "Confirm equipment from the catalogue",
      "Standard equipment should be confirmed from the catalogue, and optional equipment should only be selected when this vehicle actually has it.",
      "Medium",
      8,
    );
  } else if (equipmentCount < 3) {
    searchability -= 12;
    searchabilityImprovements.push("Confirm the most relevant standard equipment and any real optional equipment.");
  }

  if (!listing.fuelType.trim()) searchability -= 10;
  if (!listing.transmission.trim()) searchability -= 10;
  if (!listing.bodyType.trim()) searchability -= 10;
  if (wordCount < 30) searchability -= 15;

  const effectivePhotoChecklist = getEffectivePhotoChecklist(listing);
  const applicablePhotoItems = getApplicablePhotoItems(listing);
  const effectivePhotoCount = Math.max(listing.photoCount, listing.uploadedImages?.length ?? 0);
  const totalPhotoWeight = applicablePhotoItems.reduce((sum, item) => sum + item.weight, 0);
  const checkedPhotoWeight = applicablePhotoItems.reduce(
    (sum, item) => sum + (effectivePhotoChecklist[item.key] ? item.weight : 0),
    0,
  );
  const checklistScore = totalPhotoWeight > 0 ? (checkedPhotoWeight / totalPhotoWeight) * 100 : 100;
  const countScore = Math.min(100, (effectivePhotoCount / 16) * 100);
  let photoCompleteness = checklistScore * 0.65 + countScore * 0.35;

  for (const item of applicablePhotoItems) {
    if (!effectivePhotoChecklist[item.key]) {
      photoImprovements.push(`Add ${item.label.toLowerCase()} photo`);
    }
  }

  if (effectivePhotoCount < 8) {
    photoCompleteness -= 8;
    photoImprovements.unshift("Increase the photo set to at least 12 clear images");
  } else if (effectivePhotoCount < 12) {
    photoCompleteness -= 4;
    photoImprovements.unshift("Add a few more photos to reach a complete buyer walkthrough");
  }

  if (!effectivePhotoChecklist.odometer) photoCompleteness -= 6;
  if (!effectivePhotoChecklist.dashboard) photoCompleteness -= 4;
  if (!effectivePhotoChecklist.tyres) photoCompleteness -= 4;

  if (photoImprovements.length > 0) {
    addFix(
      "photos",
      "Complete the buyer photo walkthrough",
      "Missing interior, dashboard, odometer, tyre, or service book images make buyers ask for proof before contacting.",
      effectivePhotoCount < 8 ? "High" : "Medium",
      effectivePhotoCount < 8 ? 13 : 8,
    );
  }

  const pricingFeedback = getPricingFeedback(listing);
  const priceDelta = Math.abs(pricingFeedback.deltaPercent ?? 0);
  const priceScore =
    pricingFeedback.position === "within"
      ? 100
      : pricingFeedback.position === "above"
        ? priceDelta >= 20
          ? 52
          : 76
        : priceDelta >= 20
          ? 58
          : 68;

  if (pricingFeedback.position === "below") {
    buyerQuestions.push("Why is the price below comparable listings?");
    addFix(
      "pricing",
      "Explain why the price is below benchmark",
      "A cheap price can convert well only when the reason is explicit: MFK timing, cosmetic defects, quick sale, or documented work needed.",
      "Medium",
      7,
    );
  } else if (pricingFeedback.position === "above") {
    buyerQuestions.push("What justifies the premium versus similar cars?");
    addFix(
      "pricing",
      "Justify the above-market price",
      "Use proof points such as warranty, low mileage, new tyres, service invoices, options, or photo quality.",
      "Medium",
      7,
    );
  }

  if (descriptionFeedback.length > 0 && (hasMajorDescriptionIssue || descriptionQuality < 75)) {
    addFix(
      "description",
      "Rewrite the description around proof, not claims",
      "Lead with condition, ownership, service proof, MFK status, defects, and included equipment.",
      wordCount < 20 ? "High" : "Medium",
      wordCount < 20 ? 12 : 8,
    );
  }

  const vehicleDataPoints = scoreVehicleIdentification(listing);
  const equipmentPoints = scoreEquipment(listing);
  const technicalPoints = scoreTechnicalData(listing);
  const batteryPoints = scoreBatteryData(listing, isElectric);
  const trustPoints = pointsFromScore("trust-signals", "Trust signals", clampScore(trust), 20);
  const descriptionPoints = pointsFromScore(
    "description-quality",
    "Description quality",
    clampScore(descriptionQuality),
    12,
  );
  const photoPoints = pointsFromScore("image-coverage", "Image coverage", clampScore(photoCompleteness), 16);
  const marketPoints: ScoreBreakdownItem = {
    id: "market-position",
    label: "Market position",
    earned:
      pricingFeedback.position === "within"
        ? 12
        : pricingFeedback.position === "above"
          ? priceDelta >= 20
            ? 5
            : 8
          : priceDelta >= 20
            ? 5
            : 7,
    possible: 12,
    detail:
      pricingFeedback.position === "within"
        ? "Price is inside the age and mileage adjusted benchmark range."
        : pricingFeedback.concern,
  };

  scoreBreakdown.push(
    vehicleDataPoints,
    trustPoints,
    equipmentPoints,
    technicalPoints,
    photoPoints,
    descriptionPoints,
    marketPoints,
  );

  if (batteryPoints) {
    scoreBreakdown.push(batteryPoints);
  }

  const scores = {
    trust: clampScore(trust),
    descriptionQuality: clampScore(descriptionQuality),
    photoCompleteness: clampScore(photoCompleteness),
    searchability: clampScore(searchability),
    vehicleData: percentFromPoints(vehicleDataPoints),
    equipment: percentFromPoints(equipmentPoints),
    technicalData: percentFromPoints(technicalPoints),
    marketPosition: percentFromPoints(marketPoints),
    batteryData: batteryPoints ? percentFromPoints(batteryPoints) : undefined,
    overall: 0,
  };

  const coreOverall = clampScore(
    scores.trust * 0.28 +
      scores.descriptionQuality * 0.2 +
      scores.photoCompleteness * 0.2 +
      scores.searchability * 0.14 +
      priceScore * 0.18,
  );
  const pointOverall = pointsOverall(scoreBreakdown);

  scores.overall = clampScore(coreOverall * 0.72 + pointOverall * 0.28);

  const readiness =
    scores.overall >= 80 &&
    scores.trust >= 80 &&
    scores.photoCompleteness >= 80 &&
    scores.descriptionQuality >= 75
      ? "Ready to publish"
      : scores.overall < 50 ||
          scores.trust < 45 ||
          (listing.mfkStatus !== "valid" && listing.accidentHistoryStatus === "unknown")
        ? "High risk, fix first"
        : "Improve before publishing";

  const topFixes = fixes
    .sort((a, b) => impactRank[b.impact] - impactRank[a.impact] || b.scoreLift - a.scoreLift)
    .slice(0, 5)
    .map((fix) => ({
      title: fix.title,
      detail: fix.detail,
      impact: fix.impact,
      scoreLift: fix.scoreLift,
    }));
  const dedupedBuyerQuestions = dedupe(buyerQuestions).slice(0, 6);
  const predictiveInsights = buildPredictiveInsights(listing, {
    scores,
    pricingFeedback,
    buyerQuestions: dedupedBuyerQuestions,
    photoImprovements,
    descriptionFeedback,
    topFixes,
  });

  return {
    scores,
    readiness,
    scoreBreakdown,
    topFixes,
    missingTrustSignals,
    photoImprovements,
    descriptionFeedback,
    searchabilityImprovements,
    pricingFeedback,
    pastListingInsights: getPastListingInsights(listing, pricingFeedback),
    predictiveInsights,
    buyerQuestions: dedupedBuyerQuestions,
  };
}

function getPricingFeedback(listing: ListingDraft): PricingFeedback {
  const comparableListings = getComparablePastListings(listing);
  const comparablePrices = comparableListings.map((item) => item.priceChf).sort((a, b) => a - b);
  const median = medianNumber(comparablePrices);
  const average = averageNumber(comparablePrices);
  const benchmark = buildPriceBenchmark(listing, comparableListings);
  const mid = benchmark.adjustedMidpoint;
  const benchmarkLow = benchmark.benchmarkLow;
  const benchmarkHigh = benchmark.benchmarkHigh;
  const deltaPercent = mid > 0 ? Math.round(((listing.priceChf - mid) / mid) * 100) : 0;
  const context =
    `based on an estimated CHF ${formatChf(benchmark.originalNewPriceEstimate)} original new price, ` +
    `${benchmark.valuationFactors.join(", ")}, and ${comparableListings.length} comparable listing records`;

  if (listing.priceChf < benchmarkLow) {
    return {
      benchmarkLow,
      benchmarkHigh,
      averagePrice: average ? roundToNearestHundred(average) : undefined,
      medianPrice: median ? roundToNearestHundred(median) : undefined,
      sampleSize: comparableListings.length,
      benchmarkUniverseSize: MOCK_PAST_LISTING_COUNT,
      originalNewPriceEstimate: benchmark.originalNewPriceEstimate,
      adjustedBenchmarkPrice: mid,
      valuationFactors: benchmark.valuationFactors,
      deltaPercent,
      position: "below",
      concern:
        `Price is ${Math.abs(deltaPercent)}% below the age and mileage adjusted benchmark, ${context}. Explain the reason clearly so buyers do not assume hidden defects.`,
    };
  }

  if (listing.priceChf > benchmarkHigh) {
    return {
      benchmarkLow,
      benchmarkHigh,
      averagePrice: average ? roundToNearestHundred(average) : undefined,
      medianPrice: median ? roundToNearestHundred(median) : undefined,
      sampleSize: comparableListings.length,
      benchmarkUniverseSize: MOCK_PAST_LISTING_COUNT,
      originalNewPriceEstimate: benchmark.originalNewPriceEstimate,
      adjustedBenchmarkPrice: mid,
      valuationFactors: benchmark.valuationFactors,
      deltaPercent,
      position: "above",
      concern:
        `Price is ${deltaPercent}% above the age and mileage adjusted benchmark, ${context}. The listing should justify the premium with proof and documentation.`,
    };
  }

  return {
    benchmarkLow,
    benchmarkHigh,
    averagePrice: average ? roundToNearestHundred(average) : undefined,
    medianPrice: median ? roundToNearestHundred(median) : undefined,
    sampleSize: comparableListings.length,
    benchmarkUniverseSize: MOCK_PAST_LISTING_COUNT,
    originalNewPriceEstimate: benchmark.originalNewPriceEstimate,
    adjustedBenchmarkPrice: mid,
    valuationFactors: benchmark.valuationFactors,
    deltaPercent,
    position: "within",
    concern: `Price sits within the age and mileage adjusted benchmark, ${context}.`,
  };
}

function scoreVehicleIdentification(listing: ListingDraft): ScoreBreakdownItem {
  const earned = [
    listing.make,
    listing.model,
    listing.version,
    listing.year > 1900 ? "year" : "",
    listing.productionMonth && listing.productionYear ? "production date" : "",
    listing.firstRegistrationMonth && listing.firstRegistrationYear ? "first registration" : "",
    listing.priceChf > 0 ? "price" : "",
    listing.mileageKm > 0 ? "mileage" : "",
    listing.fuelType,
    listing.transmission,
    listing.bodyType,
    listing.exteriorColor,
    listing.interiorColor,
  ].filter(Boolean).length;

  return {
    id: "vehicle-identification",
    label: "Vehicle identification",
    earned: Math.min(12, earned),
    possible: 12,
    detail: "Make, model, version, production date, registration, price, mileage, drivetrain, body, and colors.",
  };
}

function scoreEquipment(listing: ListingDraft): ScoreBreakdownItem {
  const standardCount = listing.standardEquipment?.length ?? 0;
  const optionalCount = listing.optionalEquipment?.length ?? 0;
  const retrofitCount = listing.retrofits?.length ?? 0;
  const featureCount = listing.keyFeatures.length;
  const standardPoints =
    standardCount >= 24
      ? 8
      : standardCount >= 12
        ? 7
        : standardCount >= 6
          ? 4
          : standardCount > 0
            ? 2
            : 0;
  const optionalPoints = optionalCount > 0 ? Math.min(2, optionalCount) : standardCount > 0 ? 2 : 0;
  const featurePoints = featureCount >= 3 ? 1 : featureCount > 0 ? 1 : 0;
  const retrofitPoints = Math.min(1, retrofitCount);
  const earned =
    standardPoints +
    optionalPoints +
    featurePoints +
    retrofitPoints;

  return {
    id: "equipment",
    label: "Equipment",
    earned: Math.min(12, earned),
    possible: 12,
    detail:
      `${standardCount} standard confirmed, ` +
      `${optionalCount ? `${optionalCount} optional selected` : "no optional equipment selected"}, ` +
      `${retrofitCount} retrofit/accessory items. Optional extras are not required; accuracy matters most.`,
  };
}

function scoreTechnicalData(listing: ListingDraft): ScoreBreakdownItem {
  const data = listing.technicalData;
  const fields = data
    ? [
        data.doors,
        data.seats,
        data.powerHp,
        data.powerKw,
        data.emptyWeightKg,
        data.towingCapacityBrakedKg,
        data.lengthMm,
        data.widthMm,
        data.heightMm,
        data.typeApprovalNumber,
        data.vehicleIdentificationNumber,
        data.energyLabel,
      ]
    : [];

  return {
    id: "technical-data",
    label: "Technical data",
    earned: Math.min(12, fields.filter(Boolean).length),
    possible: 12,
    detail: "Doors, seats, power, weights, dimensions, type approval, VIN, and energy label.",
  };
}

function scoreBatteryData(listing: ListingDraft, isElectric: boolean): ScoreBreakdownItem | null {
  if (!isElectric) return null;

  const data = listing.batteryData;
  const earned =
    (data?.rangeKm ? 2 : 0) +
    (data?.batteryCapacityKWh ? 2 : 0) +
    (data?.batteryOwnershipModel ? 2 : 0) +
    (data?.batteryHealthPercent && data.hasBatteryHealthCertificate ? 2 : 0) +
    (data?.chargingPlugAc && data.chargingPowerAcKw ? 2 : 0) +
    (data?.chargingPlugDc && data.chargingPowerDcKw && data.chargingCableIncluded ? 2 : 0);

  return {
    id: "battery-data",
    label: "Battery data",
    earned,
    possible: 12,
    detail: "Range, battery capacity, ownership, health certificate, AC charging, and DC charging.",
  };
}

function pointsFromScore(id: string, label: string, score: number, possible: number): ScoreBreakdownItem {
  return {
    id,
    label,
    earned: Math.round((score / 100) * possible),
    possible,
    detail: `${score}/100 rule score converted into pre-publish points.`,
  };
}

function percentFromPoints(item: ScoreBreakdownItem) {
  if (item.possible === 0) return 100;
  return clampScore((item.earned / item.possible) * 100);
}

function pointsOverall(items: ScoreBreakdownItem[]) {
  const earned = items.reduce((sum, item) => sum + item.earned, 0);
  const possible = items.reduce((sum, item) => sum + item.possible, 0);
  return possible ? clampScore((earned / possible) * 100) : 0;
}

function getEffectivePhotoChecklist(listing: ListingDraft): PhotoChecklist {
  const next = { ...listing.photoChecklist };

  for (const image of listing.uploadedImages ?? []) {
    if (image.coverage !== "other") {
      next[image.coverage] = true;
    }
  }

  return next;
}

function getApplicablePhotoItems(listing: ListingDraft) {
  const damageProofRequired =
    listing.accidentHistoryStatus === "repaired" || listing.accidentHistoryStatus === "has-damage";

  return photoChecklistItems.filter((item) => item.key !== "defectsDamage" || damageProofRequired);
}

function getPastListingInsights(listing: ListingDraft, pricingFeedback: PricingFeedback) {
  const comparables = getComparablePastListings(listing);
  const sold = comparables.filter((item) => item.sold);
  const successful = comparables.filter((item) => item.successful);
  const avgDays = Math.round(averageNumber(sold.map((item) => item.daysToSell)) || 0);
  const highQualityLeadAvg = Math.round(
    averageNumber(comparables.filter((item) => item.qualityScore >= 85).map((item) => item.leadCount)) || 0,
  );
  const avgSuccessfulContactRate = averageNumber(successful.map((item) => item.contactRate)) || 0;
  const currentPrice = `CHF ${formatChf(listing.priceChf)}`;

  return [
    `${comparables.length} historical comparable listings matched this vehicle or segment.`,
    avgDays ? `Sold comparable listings averaged ${avgDays} days online.` : "No sold comparable listings found in the comparable records.",
    avgSuccessfulContactRate
      ? `Successful comparable listings averaged ${(avgSuccessfulContactRate * 100).toFixed(1)}% contact rate.`
      : "Successful comparable listings were limited in this segment.",
    highQualityLeadAvg
      ? `High-quality comparable listings averaged ${highQualityLeadAvg} buyer leads.`
      : "High-quality comparable listings were limited in this segment.",
    `${currentPrice} is ${pricingFeedback.position} the benchmark band.`,
  ];
}

function hasUrgencyLanguage(text: string) {
  return includesAny(text, [
    "must sell",
    "sell quickly",
    "quick sale",
    "urgent",
    "need gone",
    "asap",
  ]);
}

function includesAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function countMatchedPhrases(text: string, phrases: string[]) {
  return phrases.filter((phrase) => text.includes(phrase)).length;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function clampScore(value: number) {
  return Math.round(clamp(value, 0, 100));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToNearestHundred(value: number) {
  return Math.round(value / 100) * 100;
}

function medianNumber(values: number[]) {
  if (values.length === 0) return 0;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2 : (values[middle] ?? 0);
}

function averageNumber(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatChf(value: number) {
  return new Intl.NumberFormat("de-CH").format(value);
}

function dedupe(items: string[]) {
  return Array.from(new Set(items));
}
