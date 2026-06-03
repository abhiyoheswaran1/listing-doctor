import { analyzeListing } from "./analyze";
import { generateListingDescription } from "./descriptionAssistant";
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
  return generateListingDescription(listing, "scratch").description;
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

function formatWarranty(value: string) {
  return value.replace(/-/g, " ");
}
