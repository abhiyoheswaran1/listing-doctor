import { analyzeListing } from "./analyze";
import type { ListingDraft, ListingReport } from "./types";

export function generateReport(listing: ListingDraft): ListingReport {
  const analysis = analyzeListing(listing);

  return {
    ...analysis,
    improvedTitle: buildImprovedTitle(listing),
    rewrittenDescription: buildRewrittenDescription(listing),
    finalPrePublishChecklist: buildPrePublishChecklist(listing),
  };
}

function buildImprovedTitle(listing: ListingDraft) {
  const trustBadges = [
    listing.mfkStatus === "valid" ? "MFK valid" : null,
    listing.serviceHistoryStatus === "complete" ? "complete service history" : null,
    listing.accidentHistoryStatus === "accident-free" ? "accident-free" : null,
    listing.warrantyStatus !== "none" && listing.warrantyStatus !== "unknown" ? formatWarranty(listing.warrantyStatus) : null,
  ].filter(Boolean);

  const details = [
    listing.fuelType,
    listing.transmission,
    listing.bodyType,
    ...trustBadges.slice(0, 2),
  ].filter(Boolean);

  return `${listing.year} ${listing.make} ${listing.model}${details.length ? `, ${details.join(", ")}` : ""}`;
}

function buildRewrittenDescription(listing: ListingDraft) {
  const features = listing.keyFeatures.length
    ? listing.keyFeatures.join(", ")
    : "add the most important equipment before publishing";

  const trustLines = [
    `MFK: ${formatStatus(listing.mfkStatus)}.`,
    `Service history: ${formatStatus(listing.serviceHistoryStatus)}.`,
    `Accident history: ${formatStatus(listing.accidentHistoryStatus)}.`,
    `Warranty: ${formatStatus(listing.warrantyStatus)}.`,
  ];

  const buyerProof =
    listing.mfkStatus === "valid" &&
    listing.serviceHistoryStatus === "complete" &&
    listing.accidentHistoryStatus === "accident-free"
      ? "The key trust signals are already strong, so keep the documentation visible in the photos."
      : "Clarify any missing documentation before publishing so buyers understand the vehicle condition immediately.";

  return [
    `${listing.year} ${listing.make} ${listing.model} with ${listing.mileageKm.toLocaleString("de-CH")} km, ${listing.fuelType.toLowerCase()} powertrain, ${listing.transmission.toLowerCase()} transmission, and ${listing.bodyType.toLowerCase()} body style.`,
    trustLines.join(" "),
    `Key equipment: ${features}.`,
    buyerProof,
    listing.sellerNotes ? `Seller note: ${listing.sellerNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPrePublishChecklist(listing: ListingDraft) {
  const checklist = [
    "Confirm make, model, year, mileage, price, fuel type, transmission, and body type.",
    "Add MFK date or explain why MFK is not available.",
    "State service history status and upload service book or invoice photos.",
    "State accident history clearly, including repaired or current damage.",
    "Add warranty status or sold-as-seen disclosure.",
    "Check that exterior, interior, dashboard, odometer, tyre, and service book photos are present.",
    "Remove urgency language and replace it with factual viewing or handover details.",
    "List the most searched equipment and options.",
    "Explain any price that is unusually high or low for the segment.",
  ];

  if (/electric|tesla|ev/i.test(`${listing.fuelType} ${listing.make} ${listing.model}`)) {
    checklist.push("Add battery warranty, battery health, charging cable, and realistic range information.");
  }

  return checklist;
}

function formatStatus(value: string) {
  return value.replace(/-/g, " ");
}

function formatWarranty(value: string) {
  return value.replace(/-/g, " ");
}
