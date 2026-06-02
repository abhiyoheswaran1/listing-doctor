"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Camera,
  FileText,
  ImagePlus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  optionalEquipmentCatalog,
  retrofitCatalog,
  standardEquipmentCatalog,
} from "@/lib/listing-doctor/equipmentCatalog";
import {
  type DescriptionAssistantMode,
  type DescriptionAssistantResult,
  generateListingDescription,
} from "@/lib/listing-doctor/descriptionAssistant";
import type { DescriptionStaleness } from "@/lib/listing-doctor/descriptionStaleness";
import {
  addUploadedImages,
  getTaggedImageCount,
  getUploadedImageCount,
  removeUploadedImage,
  retagUploadedImage,
  toggleDemoPhotoSlot,
} from "@/lib/listing-doctor/imageUploads";
import {
  parseRequiredNumberInputValue,
  requiredNumberInputValue,
} from "@/lib/listing-doctor/numberInputs";
import { estimateOriginalNewPrice } from "@/lib/listing-doctor/pricing";
import {
  photoChecklistItems,
  type AccidentHistoryStatus,
  type BatteryData,
  type ImageCoverageKey,
  type ListingDraft,
  type MfkStatus,
  type PhotoChecklistKey,
  type SellerType,
  type ServiceHistoryStatus,
  type TechnicalData,
  type UploadedImage,
  type WarrantyStatus,
} from "@/lib/listing-doctor/types";
import { cn } from "@/lib/utils";

import { SelectInput, TextAreaInput, TextInput } from "./form-controls";
import { InsertionSection } from "./insertion-section";

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const sellerTypes: SellerType[] = ["private", "dealer"];
const mfkStatuses: MfkStatus[] = ["valid", "expired", "missing", "unknown"];
const serviceStatuses: ServiceHistoryStatus[] = ["complete", "partial", "unknown", "missing"];
const accidentStatuses: AccidentHistoryStatus[] = [
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

export function ListingDetailsPage({
  listing,
  onListingChange,
  onDescriptionGenerated,
  onDescriptionManuallyEdited,
  descriptionStaleness,
  onRefreshGeneratedDescription,
}: {
  listing: ListingDraft;
  onListingChange: (listing: ListingDraft) => void;
  onDescriptionGenerated: (mode: DescriptionAssistantMode, description: string) => void;
  onDescriptionManuallyEdited: () => void;
  descriptionStaleness: DescriptionStaleness | null;
  onRefreshGeneratedDescription: () => void;
}) {
  const [standardQuery, setStandardQuery] = useState("");
  const [optionalQuery, setOptionalQuery] = useState("");
  const [descriptionAssistantResult, setDescriptionAssistantResult] =
    useState<DescriptionAssistantResult | null>(null);

  const update = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    onListingChange({ ...listing, [key]: value });
  };

  const updateNumber = (key: "firstRegistrationYear" | "priceChf" | "mileageKm", value: string) => {
    update(key, parseRequiredNumberInputValue(value) as ListingDraft[typeof key]);
  };

  const updateTechnical = <K extends keyof TechnicalData>(key: K, value: TechnicalData[K]) => {
    update("technicalData", {
      ...(listing.technicalData ?? {}),
      [key]: value,
    });
  };

  const updateBattery = <K extends keyof BatteryData>(key: K, value: BatteryData[K]) => {
    update("batteryData", {
      ...(listing.batteryData ?? {}),
      [key]: value,
    });
  };

  const updatePhoto = (key: PhotoChecklistKey, value: boolean) => {
    onListingChange(toggleDemoPhotoSlot(listing, key, value));
  };

  const updateFeatures = (value: string) => {
    update(
      "keyFeatures",
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    );
  };

  const toggleListItem = (
    key: "standardEquipment" | "optionalEquipment" | "retrofits",
    value: string,
  ) => {
    const current = listing[key] ?? [];
    update(
      key,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const nextImages: UploadedImage[] = Array.from(files).map((file, index) => ({
      id: `uploaded-${Date.now()}-${index}`,
      name: file.name,
      coverage: "other",
      sizeKb: Math.round(file.size / 1024),
    }));
    onListingChange(addUploadedImages(listing, nextImages));
  };

  const applyDescriptionAssistant = (mode: DescriptionAssistantMode) => {
    const result = generateListingDescription(listing, mode);
    onListingChange({
      ...listing,
      description: result.description,
    });
    setDescriptionAssistantResult(result);
    onDescriptionGenerated(mode, result.description);
  };

  const imageCount = getUploadedImageCount(listing);
  const taggedImageCount = getTaggedImageCount(listing);
  const damagePhotoRequired =
    listing.accidentHistoryStatus === "repaired" || listing.accidentHistoryStatus === "has-damage";

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-panel border border-line bg-panel shadow-panel">
        <div className="grid md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="px-4 py-4 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              Page 3
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black leading-tight text-ink">
                {listing.make} {listing.model}
              </h2>
              <Badge tone="accent">Doctor running</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              {listing.version || "Version missing"} · {listing.productionMonth}{" "}
              {listing.productionYear} · {listing.fuelType} · {listing.transmission}
            </p>
          </div>
          <div className="border-t border-line bg-raised px-4 py-4 md:border-l md:border-t-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              <p className="text-xs font-black text-ink">Live quality coaching</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Every field change refreshes trust, photos, market, searchability, and description scores.
            </p>
          </div>
        </div>
      </div>

      <InsertionSection title="Condition and trust proof" eyebrow="Step 1" doctorSection="condition">
        <div className="grid gap-3 md:grid-cols-2">
          <SelectInput
            label="Seller type"
            value={listing.sellerType}
            onChange={(event) => update("sellerType", event.target.value as SellerType)}
            required
          >
            {sellerTypes.map((type) => (
              <option key={type} value={type}>
                {titleCase(type)}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            label="Last inspection MFK"
            value={listing.mfkStatus}
            onChange={(event) => update("mfkStatus", event.target.value as MfkStatus)}
            required
          >
            {mfkStatuses.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            label="Registration month"
            value={listing.firstRegistrationMonth ?? ""}
            onChange={(event) => update("firstRegistrationMonth", event.target.value)}
          >
            <option value="">Select month</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="Registration year"
            type="number"
            min={1980}
            max={2026}
            value={requiredNumberInputValue(
              listing.firstRegistrationYear ?? listing.productionYear ?? listing.year,
            )}
            onChange={(event) => updateNumber("firstRegistrationYear", event.target.value)}
          />
          <TextInput
            label="Mileage"
            type="number"
            min={0}
            value={requiredNumberInputValue(listing.mileageKm)}
            onChange={(event) => updateNumber("mileageKm", event.target.value)}
            required
          />
          <SelectInput
            label="Service history"
            value={listing.serviceHistoryStatus}
            onChange={(event) =>
              update("serviceHistoryStatus", event.target.value as ServiceHistoryStatus)
            }
          >
            {serviceStatuses.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            label="Accident history"
            value={listing.accidentHistoryStatus}
            onChange={(event) =>
              update("accidentHistoryStatus", event.target.value as AccidentHistoryStatus)
            }
          >
            {accidentStatuses.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            label="Warranty"
            value={listing.warrantyStatus}
            onChange={(event) => update("warrantyStatus", event.target.value as WarrantyStatus)}
          >
            {warrantyStatuses.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </SelectInput>
        </div>
      </InsertionSection>

      <InsertionSection title="Price" eyebrow="Step 2" doctorSection="price">
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Price CHF"
            type="number"
            min={0}
            value={requiredNumberInputValue(listing.priceChf)}
            onChange={(event) => updateNumber("priceChf", event.target.value)}
            required
          />
          <TextInput
            label="Estimated new price CHF"
            type="number"
            min={0}
            value={estimateOriginalNewPrice(listing)}
            readOnly
            hint="Estimated from make, model, version, and body type. Not derived from the asking price."
          />
        </div>
      </InsertionSection>

      <EquipmentSection
        title="Identified as standard equipment"
        doctorSection="standard-equipment"
        items={standardEquipmentCatalog}
        selected={listing.standardEquipment ?? []}
        query={standardQuery}
        onQueryChange={setStandardQuery}
        onToggle={(item) => toggleListItem("standardEquipment", item)}
      />

      <EquipmentSection
        title="Optional equipment"
        doctorSection="optional-equipment"
        items={optionalEquipmentCatalog}
        selected={listing.optionalEquipment ?? []}
        query={optionalQuery}
        onQueryChange={setOptionalQuery}
        onToggle={(item) => toggleListItem("optionalEquipment", item)}
      />

      <InsertionSection title="Retrofittings and accessories" doctorSection="retrofits">
        <DenseCheckboxGrid
          items={retrofitCatalog}
          selected={listing.retrofits ?? []}
          onToggle={(item) => toggleListItem("retrofits", item)}
        />
      </InsertionSection>

      <InsertionSection title="Technical data" eyebrow="Step 3" doctorSection="technical">
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput label="Doors" type="number" value={listing.technicalData?.doors ?? ""} onChange={(event) => updateTechnical("doors", toOptionalNumber(event.target.value))} />
          <TextInput label="Seats" type="number" value={listing.technicalData?.seats ?? ""} onChange={(event) => updateTechnical("seats", toOptionalNumber(event.target.value))} />
          <SelectInput label="Energy label" value={listing.technicalData?.energyLabel ?? ""} onChange={(event) => updateTechnical("energyLabel", event.target.value)}>
            <option value="">Select energy label</option>
            {["A", "B", "C", "D", "E", "F", "G"].map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </SelectInput>
          <TextInput label="HP" type="number" value={listing.technicalData?.powerHp ?? ""} onChange={(event) => updateTechnical("powerHp", toOptionalNumber(event.target.value))} />
          <TextInput label="kW" type="number" value={listing.technicalData?.powerKw ?? ""} onChange={(event) => updateTechnical("powerKw", toOptionalNumber(event.target.value))} />
          <TextInput label="Empty weight kg" type="number" value={listing.technicalData?.emptyWeightKg ?? ""} onChange={(event) => updateTechnical("emptyWeightKg", toOptionalNumber(event.target.value))} />
          <TextInput label="Towing capacity braked kg" type="number" value={listing.technicalData?.towingCapacityBrakedKg ?? ""} onChange={(event) => updateTechnical("towingCapacityBrakedKg", toOptionalNumber(event.target.value))} />
          <TextInput label="Length mm" type="number" value={listing.technicalData?.lengthMm ?? ""} onChange={(event) => updateTechnical("lengthMm", toOptionalNumber(event.target.value))} />
          <TextInput label="Width mm" type="number" value={listing.technicalData?.widthMm ?? ""} onChange={(event) => updateTechnical("widthMm", toOptionalNumber(event.target.value))} />
          <TextInput label="Height mm" type="number" value={listing.technicalData?.heightMm ?? ""} onChange={(event) => updateTechnical("heightMm", toOptionalNumber(event.target.value))} />
          <TextInput label="Type approval number" value={listing.technicalData?.typeApprovalNumber ?? ""} onChange={(event) => updateTechnical("typeApprovalNumber", event.target.value)} />
          <TextInput label="Vehicle identification number" value={listing.technicalData?.vehicleIdentificationNumber ?? ""} onChange={(event) => updateTechnical("vehicleIdentificationNumber", event.target.value)} />
          <TextInput label="Serial number" value={listing.technicalData?.serialNumber ?? ""} onChange={(event) => updateTechnical("serialNumber", event.target.value)} />
          <TextInput label="Vehicle number" value={listing.technicalData?.vehicleNumber ?? ""} onChange={(event) => updateTechnical("vehicleNumber", event.target.value)} />
        </div>
      </InsertionSection>

      {isElectricListing(listing) ? (
        <InsertionSection title="Battery data" eyebrow="EV" doctorSection="battery">
          <div className="mb-4 rounded border border-warning/40 bg-warning/10 p-4 text-center">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full border border-warning/40 bg-raised">
              <Sparkles className="size-4 text-accent-ink" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-ink">Can you provide a battery health certificate?</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Battery proof is one of the strongest trust signals for EV buyers.
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded border border-line bg-accent px-3 py-2 text-xs font-bold text-accent-ink">
              <input
                type="checkbox"
                checked={listing.batteryData?.hasBatteryHealthCertificate ?? false}
                onChange={(event) => updateBattery("hasBatteryHealthCertificate", event.target.checked)}
                className="size-4 w-4"
              />
              Battery certificate available
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Range km" type="number" value={listing.batteryData?.rangeKm ?? ""} onChange={(event) => updateBattery("rangeKm", toOptionalNumber(event.target.value))} />
            <TextInput label="Battery capacity kWh" type="number" value={listing.batteryData?.batteryCapacityKWh ?? ""} onChange={(event) => updateBattery("batteryCapacityKWh", toOptionalNumber(event.target.value))} />
            <SelectInput label="Battery ownership model" value={listing.batteryData?.batteryOwnershipModel ?? ""} onChange={(event) => updateBattery("batteryOwnershipModel", event.target.value)}>
              <option value="">Select ownership model</option>
              <option value="Included in purchase price">Included in purchase price</option>
              <option value="Battery lease">Battery lease</option>
              <option value="Unknown">Unknown</option>
            </SelectInput>
            <TextInput label="Battery state of health %" type="number" value={listing.batteryData?.batteryHealthPercent ?? ""} onChange={(event) => updateBattery("batteryHealthPercent", toOptionalNumber(event.target.value))} />
            <SelectInput label="Charging plug type AC" value={listing.batteryData?.chargingPlugAc ?? ""} onChange={(event) => updateBattery("chargingPlugAc", event.target.value)}>
              <option value="">Select AC plug</option>
              <option value="Type 2">Type 2</option>
              <option value="Type 1">Type 1</option>
            </SelectInput>
            <TextInput label="Charging power AC kW" type="number" value={listing.batteryData?.chargingPowerAcKw ?? ""} onChange={(event) => updateBattery("chargingPowerAcKw", toOptionalNumber(event.target.value))} />
            <SelectInput label="Charging plug type DC" value={listing.batteryData?.chargingPlugDc ?? ""} onChange={(event) => updateBattery("chargingPlugDc", event.target.value)}>
              <option value="">Select DC plug</option>
              <option value="CCS">CCS</option>
              <option value="CHAdeMO">CHAdeMO</option>
            </SelectInput>
            <TextInput label="Fast charging power DC kW" type="number" value={listing.batteryData?.chargingPowerDcKw ?? ""} onChange={(event) => updateBattery("chargingPowerDcKw", toOptionalNumber(event.target.value))} />
            <TextInput label="AC charging time minutes" type="number" value={listing.batteryData?.chargingTimeAcMinutes ?? ""} onChange={(event) => updateBattery("chargingTimeAcMinutes", toOptionalNumber(event.target.value))} />
            <TextInput label="Fast charging time minutes" type="number" value={listing.batteryData?.chargingTimeDcMinutes ?? ""} onChange={(event) => updateBattery("chargingTimeDcMinutes", toOptionalNumber(event.target.value))} />
            <label className="flex min-h-9 items-center gap-2 pt-6 text-xs font-semibold normal-case tracking-normal text-muted">
              <input
                type="checkbox"
                checked={listing.batteryData?.chargingCableIncluded ?? false}
                onChange={(event) => updateBattery("chargingCableIncluded", event.target.checked)}
                className="size-4 w-4 accent-[oklch(var(--color-accent))]"
              />
              Charging cable included
            </label>
          </div>
        </InsertionSection>
      ) : null}

      <InsertionSection
        title="Photos and image upload"
        eyebrow="Step 4"
        doctorSection="images"
        actions={<Badge tone="accent">{imageCount} images</Badge>}
      >
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="rounded-[3px] border border-dashed border-line bg-raised p-4 text-center">
            <ImagePlus className="mx-auto size-9 text-muted" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-ink">Upload vehicle images</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Image tags tell Listing Doctor what proof is available.
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded border border-accent bg-accent px-3 py-2 text-xs font-bold text-accent-ink">
              <Upload className="mr-2 size-3.5" aria-hidden="true" />
              Upload images
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  handleImageUpload(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <div className="mt-4 space-y-2 rounded-[3px] border border-line bg-panel p-3 text-left">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold uppercase tracking-[0.08em] text-muted">Uploaded images</span>
                <span className="text-lg font-black text-ink">{imageCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold uppercase tracking-[0.08em] text-muted">Tagged proof</span>
                <span className="text-lg font-black text-ink">{taggedImageCount}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-[3px] border border-line bg-raised p-3">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-muted" aria-hidden="true" />
                  <p className="text-xs font-black text-ink">Demo image slots</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Tick a slot to mark that proof image as available for the walkthrough.
                </p>
              </div>
              <div className="rounded-[3px] border border-line bg-raised p-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted" aria-hidden="true" />
                  <p className="text-xs font-black text-ink">Uploaded file tags</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Uploaded files count immediately, then become proof once tagged below.
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {photoChecklistItems.map((item) => (
                <label
                  key={item.key}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center gap-2 rounded-[3px] border px-2.5 py-2 text-xs font-bold normal-case tracking-normal transition",
                    listing.photoChecklist[item.key]
                      ? "border-success/30 bg-success/10 text-ink"
                      : "border-line bg-raised text-muted",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={listing.photoChecklist[item.key]}
                    onChange={(event) => updatePhoto(item.key, event.target.checked)}
                    className="size-4 w-4 accent-[oklch(var(--color-accent))]"
                  />
                  <Camera className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {item.key === "defectsDamage" && !damagePhotoRequired
                      ? "Defects/damage if any"
                      : item.label}
                  </span>
                </label>
              ))}
            </div>
            {(listing.uploadedImages ?? []).length ? (
              <div className="space-y-2">
                {(listing.uploadedImages ?? []).map((image) => (
                  <div key={image.id} className="grid gap-2 rounded-[3px] border border-line bg-raised p-2 sm:grid-cols-[1fr_180px_auto] sm:items-center">
                    <div className="truncate text-xs font-bold text-ink">{image.name}</div>
                    <select
                      aria-label={`Image tag for ${image.name}`}
                      value={image.coverage}
                      onChange={(event) =>
                        onListingChange(
                          retagUploadedImage(listing, image.id, event.target.value as ImageCoverageKey),
                        )
                      }
                    >
                      <option value="other">Not tagged yet</option>
                      {photoChecklistItems.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onListingChange(removeUploadedImage(listing, image.id))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </InsertionSection>

      <InsertionSection title="Detailed information" eyebrow="Step 5" doctorSection="description">
        <div className="space-y-3">
          <TextAreaInput
            label="Key features/options"
            value={listing.keyFeatures.join("\n")}
            onChange={(event) => updateFeatures(event.target.value)}
            placeholder="Adaptive cruise control&#10;Navigation&#10;Winter wheels"
            hint="One feature per line, or separate with commas."
          />
          <div className="rounded-[3px] border border-line bg-raised p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-ink">Description assistant</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Creates buyer-facing SEO copy from this listing and successful comparable listings.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => applyDescriptionAssistant("scratch")}
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Help me write
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => applyDescriptionAssistant("polish")}
                  disabled={!listing.description.trim()}
                >
                  <FileText className="size-3.5" aria-hidden="true" />
                  Make mine better
                </Button>
              </div>
            </div>
            {descriptionAssistantResult ? (
              <div className="mt-3 space-y-2 border-t border-line pt-2">
                <p className="text-[11px] font-semibold leading-4 text-muted">
                  {descriptionAssistantResult.sourceSummary}
                </p>
                {descriptionAssistantResult.writingWarnings.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {descriptionAssistantResult.writingWarnings.slice(0, 3).map((warning) => (
                      <span
                        key={warning}
                        className="rounded-[3px] border border-warning/35 bg-warning/10 px-2 py-1 text-[11px] font-bold leading-4 text-ink"
                      >
                        {warning}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] font-bold leading-4 text-success">
                    Strong trust facts are available for the generated description.
                  </p>
                )}
              </div>
            ) : null}
          </div>
          {descriptionStaleness?.isStale ? (
            <div className="rounded-[3px] border border-warning/40 bg-warning/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
                <div>
                  <p className="text-xs font-black text-ink">Description may no longer match the form</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-muted">
                    {descriptionStaleness.summary}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                onClick={onRefreshGeneratedDescription}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Refresh description
              </Button>
            </div>
          ) : null}
          <TextAreaInput
            label="Vehicle description"
            value={listing.description}
            onChange={(event) => {
              update("description", event.target.value);
              onDescriptionManuallyEdited();
            }}
            required
            placeholder="Describe condition, ownership, service proof, MFK, accident status, defects, and included equipment."
          />
          <TextAreaInput
            label="Optional seller notes"
            value={listing.sellerNotes ?? ""}
            onChange={(event) => update("sellerNotes", event.target.value)}
            placeholder="Viewing location, included wheels, EV charging cable, battery warranty, handover timing."
          />
        </div>
      </InsertionSection>
    </div>
  );
}

function EquipmentSection({
  title,
  doctorSection,
  items,
  selected,
  query,
  onQueryChange,
  onToggle,
}: {
  title: string;
  doctorSection: string;
  items: string[];
  selected: string[];
  query: string;
  onQueryChange: (value: string) => void;
  onToggle: (item: string) => void;
}) {
  const filtered = items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  return (
    <InsertionSection
      title={title}
      doctorSection={doctorSection}
      actions={<Badge tone="neutral">{selected.length} selected</Badge>}
    >
      <div className="mb-3 max-w-sm">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search for equipment"
          className="h-10"
        />
      </div>
      <DenseCheckboxGrid items={filtered} selected={selected} onToggle={onToggle} />
    </InsertionSection>
  );
}

function DenseCheckboxGrid({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
      {items.map((item) => (
        <label
          key={item}
          className={cn(
            "flex min-h-7 cursor-pointer items-center gap-2 rounded-[3px] px-1.5 py-1 text-xs font-semibold normal-case tracking-normal transition",
            selected.includes(item)
              ? "bg-accent/20 text-ink"
              : "text-ink hover:bg-raised",
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            className="size-3.5 w-3.5 accent-[oklch(var(--color-accent))]"
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function isElectricListing(listing: ListingDraft) {
  return /electric|tesla|ev/i.test(`${listing.fuelType} ${listing.make} ${listing.model}`);
}

function toOptionalNumber(value: string) {
  return value === "" ? undefined : Number.parseInt(value, 10);
}

function humanize(value: string) {
  return titleCase(value.replace(/-/g, " "));
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
