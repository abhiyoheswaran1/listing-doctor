import { getComparablePastListings } from "./pastListings";
import type { ListingDraft, PastListing } from "./types";

export type DescriptionAssistantMode = "scratch" | "polish";
export type DescriptionLanguage = "en" | "de" | "fr" | "it";
export type DescriptionAssistantProvider = "deterministic" | "openai" | "openai-sanitized";

export type DescriptionAssistantResult = {
  description: string;
  title?: string;
  comparableCount: number;
  successfulComparableCount: number;
  sourceSummary: string;
  styleNotes: string[];
  writingWarnings: string[];
  factsUsed?: string[];
  claimsNotUsed?: string[];
  buyerObjections?: string[];
  provider?: DescriptionAssistantProvider;
  language?: DescriptionLanguage;
};

type ComparableContext = {
  totalComparableCount: number;
  successfulComparableCount: number;
  averageLeadCount: number;
  averageDaysToSell: number;
  styleNotes: string[];
};

export function generateListingDescription(
  listing: ListingDraft,
  mode: DescriptionAssistantMode,
): DescriptionAssistantResult {
  const context = getDescriptionComparableContext(listing);
  const paragraphs = [
    buildSeoOpening(listing),
    mode === "polish" ? buildPolishedSellerParagraph(listing) : "",
    buildProofParagraph(listing),
    buildEquipmentParagraph(listing),
    buildClosingParagraph(listing),
  ].filter(Boolean);

  return {
    description: paragraphs.join("\n\n"),
    comparableCount: context.totalComparableCount,
    successfulComparableCount: context.successfulComparableCount,
    sourceSummary: `Based on the current draft and ${context.successfulComparableCount} successful comparable listings from ${context.totalComparableCount} matched records; high-performing matches averaged ${context.averageLeadCount} leads and ${context.averageDaysToSell} days online.`,
    styleNotes: context.styleNotes,
    writingWarnings: getWritingWarnings(listing),
  };
}

export function getDescriptionComparableContext(listing: ListingDraft): ComparableContext {
  const comparables = getComparablePastListings(listing);
  const successful = getSuccessfulComparables(comparables);
  const sample = successful.length ? successful : comparables.slice(0, 12);

  return {
    totalComparableCount: comparables.length,
    successfulComparableCount: successful.length,
    averageLeadCount: average(sample.map((item) => item.leadCount)),
    averageDaysToSell: average(sample.map((item) => item.daysToSell)),
    styleNotes: [
      "Lead with exact model, version, mileage, fuel type, transmission, and body style.",
      "Put MFK, service history, accident status, and warranty proof before lifestyle claims.",
      "Name searchable equipment naturally instead of keyword stuffing.",
      "Mention EV battery and charging proof when the vehicle is electric.",
      "Close with practical handover, viewing, or included-item details.",
    ],
  };
}

function getSuccessfulComparables(comparables: PastListing[]) {
  return comparables
    .filter((item) => item.successful)
    .sort((a, b) => b.contactRate - a.contactRate || b.leadCount - a.leadCount || a.daysToSell - b.daysToSell)
    .slice(0, 36);
}

function buildSeoOpening(listing: ListingDraft) {
  const version = listing.version ? ` ${listing.version}` : "";
  const mileage = `${formatNumber(listing.mileageKm)} km`;
  const details = [
    listing.fuelType ? listing.fuelType.toLowerCase() : "",
    listing.transmission ? listing.transmission.toLowerCase() : "",
    listing.bodyType ? `${listing.bodyType.toLowerCase()} body style` : "",
  ].filter(Boolean);

  const specification = details.length ? `, ${formatList(details)}` : "";

  if (isElectricListing(listing)) {
    return `${listing.year} ${listing.make} ${listing.model}${version} listed in Switzerland with ${mileage}${specification}.`;
  }

  if (hasStrongTrustProof(listing)) {
    return `Swiss-market ${listing.year} ${listing.make} ${listing.model}${version} available in Switzerland with ${mileage}${specification}.`;
  }

  return `${listing.year} ${listing.make} ${listing.model}${version} for sale in Switzerland with ${mileage}${specification}.`;
}

function buildPolishedSellerParagraph(listing: ListingDraft) {
  const cleaned = cleanSellerText(listing.description, listing);
  if (!cleaned) return "";

  return `Seller highlights: ${cleaned}`;
}

function buildProofParagraph(listing: ListingDraft) {
  const facts = [
    listing.mfkStatus === "valid" ? "MFK valid" : "",
    listing.mfkStatus === "expired" ? "MFK expired" : "",
    listing.serviceHistoryStatus === "complete" ? "complete service history available" : "",
    listing.serviceHistoryStatus === "partial" ? "partial service history available" : "",
    listing.accidentHistoryStatus === "accident-free" ? "accident-free history stated" : "",
    listing.accidentHistoryStatus === "repaired" ? "repaired accident history disclosed" : "",
    listing.accidentHistoryStatus === "has-damage" ? "known damage disclosed" : "",
    ["manufacturer warranty", "dealer warranty", "battery warranty"].includes(listing.warrantyStatus)
      ? `${listing.warrantyStatus} included`
      : "",
  ].filter(Boolean);

  const segmentNote = buildSegmentNote(listing);

  if (!facts.length && !segmentNote) return "";

  return [
    facts.length ? `${getProofLabel(listing)}: ${capitalize(formatList(facts))}.` : "",
    segmentNote,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildEquipmentParagraph(listing: ListingDraft) {
  const equipment = uniqueEquipment([
    ...listing.keyFeatures,
    ...(listing.optionalEquipment ?? []),
    ...(listing.standardEquipment ?? []).slice(0, 6),
  ]).slice(0, 10);

  if (!equipment.length) {
    return "";
  }

  return `${getEquipmentIntro(listing)} ${formatList(equipment)}.`;
}

function buildSegmentNote(listing: ListingDraft) {
  if (isElectricListing(listing)) {
    const battery = listing.batteryData;
    const batteryDetails = [
      battery?.batteryHealthPercent ? `battery health ${battery.batteryHealthPercent}%` : "",
      battery?.rangeKm ? `range around ${formatNumber(battery.rangeKm)} km` : "",
      battery?.chargingCableIncluded ? "charging cable included" : "",
      listing.warrantyStatus === "battery warranty" ? "battery warranty" : "",
    ].filter(Boolean);

    return batteryDetails.length ? `Battery and charging: ${batteryDetails.join(", ")}.` : "";
  }

  return "";
}

function buildClosingParagraph(listing: ListingDraft) {
  if (hasUnconfirmedSellerNote(listing.sellerNotes ?? "")) return "";

  const notes = cleanSellerText(listing.sellerNotes ?? "");
  if (notes) return `Seller note: ${notes}`;

  return "";
}

function getWritingWarnings(listing: ListingDraft) {
  return [
    listing.mfkStatus !== "valid" ? "Add the MFK date or explain the inspection status before publishing." : "",
    listing.serviceHistoryStatus !== "complete" ? "Add service invoices or service book proof if available." : "",
    listing.accidentHistoryStatus === "unknown" ? "State accident history clearly before publishing." : "",
    listing.warrantyStatus === "none" || listing.warrantyStatus === "unknown" ? "Clarify warranty terms or sold-as-seen terms." : "",
    hasUnconfirmedSellerNote(listing.sellerNotes ?? "")
      ? "Confirm seller notes before adding them to the public description."
      : "",
  ].filter(Boolean);
}

function cleanSellerText(value: string, listing?: ListingDraft) {
  if (listing && isAssistantGeneratedDescription(value, listing)) return "";

  const cleaned = value
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !/must sell|urgent|quickly|call me|last price|no time wasters/i.test(sentence))
    .map((sentence) => sentence.replace(/\s+/g, " "))
    .slice(0, 2)
    .join(". ")
    .replace(/\.$/, "");

  return cleaned ? `${cleaned}.` : "";
}

function formatList(items: string[]) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function unique(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueEquipment(items: string[]) {
  const normalizedItems = unique(items);
  const selected: string[] = [];

  for (const item of normalizedItems) {
    const key = equipmentKey(item);
    const duplicateIndex = selected.findIndex((selectedItem) => {
      const selectedKey = equipmentKey(selectedItem);
      return selectedKey === key || selectedKey.includes(key) || key.includes(selectedKey);
    });

    if (duplicateIndex === -1) {
      selected.push(item);
      continue;
    }

    if (item.length > selected[duplicateIndex].length) {
      selected[duplicateIndex] = item;
    }
  }

  return selected;
}

function equipmentKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(system|interface|assist|assistant)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-CH").format(value);
}

function isElectricListing(listing: ListingDraft) {
  return /electric|tesla|ev/i.test(`${listing.fuelType} ${listing.make} ${listing.model}`);
}

function hasStrongTrustProof(listing: ListingDraft) {
  return (
    listing.mfkStatus === "valid" &&
    listing.serviceHistoryStatus === "complete" &&
    listing.accidentHistoryStatus === "accident-free" &&
    listing.warrantyStatus !== "none" &&
    listing.warrantyStatus !== "unknown"
  );
}

function getProofLabel(listing: ListingDraft) {
  if (isElectricListing(listing)) return "Proof and battery documentation";
  if (hasStrongTrustProof(listing)) return "Proof and documentation";
  return "Documented facts";
}

function getEquipmentIntro(listing: ListingDraft) {
  if (isElectricListing(listing)) return "Technology and equipment include";
  if (/hybrid/i.test(listing.fuelType)) return "Comfort and driver-assistance equipment include";
  if (listing.mileageKm >= 140000) return "Useful equipment includes";
  return "Notable equipment includes";
}

function hasUnconfirmedSellerNote(value: string) {
  return /\b(may|might|maybe|possibly|probably|perhaps|tbc|to be confirmed|not sure|available on request|can be discussed|if needed)\b/i.test(
    value,
  );
}

function isAssistantGeneratedDescription(value: string, listing: ListingDraft) {
  const normalized = value.toLowerCase();
  const identity = `${listing.year} ${listing.make} ${listing.model}`.toLowerCase();

  return (
    normalized.includes(identity) &&
    (normalized.includes("for sale in switzerland") ||
      normalized.includes("listed in switzerland") ||
      normalized.includes("available in switzerland") ||
      normalized.includes("swiss-market")) &&
    [
      "equipment highlights include",
      "notable equipment includes",
      "useful equipment includes",
      "technology and equipment include",
      "comfort and driver-assistance equipment include",
      "searchable equipment and options include",
      "trust and documentation",
      "proof and documentation",
      "proof and battery documentation",
      "documented facts",
      "seller note:",
      "battery and charging",
      "key information buyers search",
    ].some((marker) => normalized.includes(marker))
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
