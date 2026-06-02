import type {
  AccidentHistoryStatus,
  ListingDraft,
  MfkStatus,
  SellerType,
  ServiceHistoryStatus,
  WarrantyStatus,
} from "./types";

const sellerTypes: SellerType[] = ["private", "dealer"];
const mfkStatuses: MfkStatus[] = ["valid", "expired", "missing", "unknown"];
const serviceHistoryStatuses: ServiceHistoryStatus[] = ["complete", "partial", "unknown", "missing"];
const accidentHistoryStatuses: AccidentHistoryStatus[] = [
  "accident-free",
  "repaired",
  "unknown",
  "has-damage",
];
const warrantyStatuses: WarrantyStatus[] = [
  "manufacturer warranty",
  "dealer warranty",
  "battery warranty",
  "none",
  "unknown",
];
const photoChecklistKeys = [
  "frontExterior",
  "rearExterior",
  "leftSide",
  "rightSide",
  "interior",
  "dashboard",
  "odometer",
  "tyres",
  "serviceBook",
  "defectsDamage",
];

export function validateListingPayload(value: unknown): string[] {
  const details: string[] = [];
  if (!isRecord(value)) return ["listing is required"];

  requireString(value, "make", details);
  requireString(value, "model", details);
  requireNumber(value, "year", details);
  requireNumber(value, "priceChf", details);
  requireNumber(value, "mileageKm", details);
  requireString(value, "fuelType", details);
  requireString(value, "transmission", details);
  requireString(value, "bodyType", details);
  requireString(value, "description", details, { allowEmpty: true });
  requireNumber(value, "photoCount", details);

  requireEnum(value, "sellerType", sellerTypes, details);
  requireEnum(value, "mfkStatus", mfkStatuses, details);
  requireEnum(value, "serviceHistoryStatus", serviceHistoryStatuses, details);
  requireEnum(value, "accidentHistoryStatus", accidentHistoryStatuses, details);
  requireEnum(value, "warrantyStatus", warrantyStatuses, details);

  if (!isRecord(value.photoChecklist)) {
    details.push("photoChecklist is required");
  } else {
    for (const key of photoChecklistKeys) {
      if (typeof value.photoChecklist[key] !== "boolean") {
        details.push(`photoChecklist.${key} must be boolean`);
      }
    }
  }

  if (!Array.isArray(value.keyFeatures)) {
    details.push("keyFeatures must be an array");
  }

  return details;
}

export function asListingDraft(value: unknown): ListingDraft {
  return value as ListingDraft;
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  details: string[],
  options: { allowEmpty?: boolean } = {},
) {
  if (typeof value[key] !== "string" || (!options.allowEmpty && !(value[key] as string).trim())) {
    details.push(`${key} is required`);
  }
}

function requireNumber(value: Record<string, unknown>, key: string, details: string[]) {
  if (typeof value[key] !== "number" || !Number.isFinite(value[key])) {
    details.push(`${key} must be a number`);
  }
}

function requireEnum<T extends string>(
  value: Record<string, unknown>,
  key: string,
  validValues: T[],
  details: string[],
) {
  if (typeof value[key] !== "string" || !validValues.includes(value[key] as T)) {
    details.push(`${key} must be one of: ${validValues.join(", ")}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
