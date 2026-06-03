import type { DescriptionAssistantMode, DescriptionLanguage } from "./descriptionAssistant";
import type { BatteryData, ListingDraft } from "./types";

type SnapshotFieldKey =
  | "mfkStatus"
  | "serviceHistoryStatus"
  | "accidentHistoryStatus"
  | "warrantyStatus"
  | "mileageKm"
  | "priceChf"
  | "keyFeatures"
  | "standardEquipment"
  | "optionalEquipment"
  | "sellerNotes"
  | "batteryData";

type SnapshotFields = Record<SnapshotFieldKey, string>;

export type DescriptionSnapshot = {
  mode: DescriptionAssistantMode;
  language?: DescriptionLanguage;
  description: string;
  fields: SnapshotFields;
};

export type DescriptionStalenessChange = {
  field: SnapshotFieldKey;
  label: string;
  before: string;
  after: string;
};

export type DescriptionStaleness = {
  isStale: boolean;
  changedFields: DescriptionStalenessChange[];
  summary: string;
};

const fieldLabels: Record<SnapshotFieldKey, string> = {
  mfkStatus: "MFK",
  serviceHistoryStatus: "service history",
  accidentHistoryStatus: "accident history",
  warrantyStatus: "warranty",
  mileageKm: "mileage",
  priceChf: "price",
  keyFeatures: "key features",
  standardEquipment: "standard equipment",
  optionalEquipment: "optional equipment",
  sellerNotes: "seller notes",
  batteryData: "battery data",
};

export function createDescriptionSnapshot(
  listing: ListingDraft,
  mode: DescriptionAssistantMode,
  description: string,
  language?: DescriptionLanguage,
): DescriptionSnapshot {
  return {
    mode,
    language,
    description,
    fields: getSnapshotFields(listing),
  };
}

export function getDescriptionStaleness(
  listing: ListingDraft,
  snapshot: DescriptionSnapshot | null,
): DescriptionStaleness {
  if (!snapshot) {
    return {
      isStale: false,
      changedFields: [],
      summary: "",
    };
  }

  const currentFields = getSnapshotFields(listing);
  const changedFields = (Object.keys(snapshot.fields) as SnapshotFieldKey[])
    .filter((field) => snapshot.fields[field] !== currentFields[field])
    .map((field) => ({
      field,
      label: fieldLabels[field],
      before: snapshot.fields[field],
      after: currentFields[field],
    }));

  return {
    isStale: changedFields.length > 0,
    changedFields,
    summary: buildSummary(changedFields),
  };
}

function getSnapshotFields(listing: ListingDraft): SnapshotFields {
  return {
    mfkStatus: listing.mfkStatus,
    serviceHistoryStatus: listing.serviceHistoryStatus,
    accidentHistoryStatus: listing.accidentHistoryStatus,
    warrantyStatus: listing.warrantyStatus,
    mileageKm: formatNumberValue(listing.mileageKm),
    priceChf: formatNumberValue(listing.priceChf),
    keyFeatures: formatList(listing.keyFeatures),
    standardEquipment: formatList(listing.standardEquipment ?? []),
    optionalEquipment: formatList(listing.optionalEquipment ?? []),
    sellerNotes: normalizeText(listing.sellerNotes ?? ""),
    batteryData: formatBatteryData(listing.batteryData),
  };
}

function buildSummary(changes: DescriptionStalenessChange[]) {
  if (!changes.length) return "";

  const first = changes[0];
  const firstSummary = `${first.label} changed from ${first.before || "empty"} to ${first.after || "empty"}`;
  const remaining = changes.length - 1;

  return remaining > 0 ? `${firstSummary}, plus ${remaining} more source fields.` : `${firstSummary}.`;
}

function formatBatteryData(value: BatteryData | undefined) {
  if (!value) return "";

  return [
    value.rangeKm ? `range:${value.rangeKm}` : "",
    value.batteryCapacityKWh ? `capacity:${value.batteryCapacityKWh}` : "",
    value.batteryOwnershipModel ? `ownership:${normalizeText(value.batteryOwnershipModel)}` : "",
    value.batteryHealthPercent ? `health:${value.batteryHealthPercent}` : "",
    value.hasBatteryHealthCertificate ? "certificate:yes" : "certificate:no",
    value.chargingPlugAc ? `ac:${normalizeText(value.chargingPlugAc)}` : "",
    value.chargingPowerAcKw ? `ac-kw:${value.chargingPowerAcKw}` : "",
    value.chargingPlugDc ? `dc:${normalizeText(value.chargingPlugDc)}` : "",
    value.chargingPowerDcKw ? `dc-kw:${value.chargingPowerDcKw}` : "",
    value.chargingCableIncluded ? "cable:yes" : "cable:no",
  ]
    .filter(Boolean)
    .join("|");
}

function formatList(items: string[]) {
  return Array.from(new Set(items.map(normalizeText).filter(Boolean))).sort().join(", ");
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function formatNumberValue(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}
