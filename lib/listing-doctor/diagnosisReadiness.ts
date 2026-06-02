import type { ListingDraft } from "./types";

export function canDiagnoseDraft(listing: ListingDraft) {
  return Boolean(
    listing.make.trim() &&
      listing.model.trim() &&
      listing.version?.trim() &&
      listing.fuelType.trim() &&
      listing.transmission.trim() &&
      listing.bodyType.trim(),
  );
}
