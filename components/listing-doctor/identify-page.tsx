"use client";

import {
  CalendarRange,
  CarFront,
  Database,
  FileCheck2,
  Layers3,
  Sparkles,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCatalogueEntry,
  getCatalogueMakes,
  getCatalogueModels,
  getProductionMonths,
  getProductionYears,
  getVersionsForProductionDate,
} from "@/lib/listing-doctor/catalogue";
import { demoListings } from "@/lib/listing-doctor/demoListings";
import { generateMockListing } from "@/lib/listing-doctor/mockData";
import { MOCK_PAST_LISTING_COUNT } from "@/lib/listing-doctor/pastListings";
import type { ListingDraft } from "@/lib/listing-doctor/types";

import { Field, SelectInput, TextInput } from "./form-controls";
import { InsertionSection } from "./insertion-section";

export function IdentifyPage({
  listing,
  selectedDemoId,
  mockSeed,
  onListingChange,
  onSelectedDemoChange,
  onMockSeedChange,
  onLoadDemo,
  onGenerateMock,
  onClear,
}: {
  listing: ListingDraft;
  selectedDemoId: string;
  mockSeed: string;
  onListingChange: (listing: ListingDraft) => void;
  onSelectedDemoChange: (id: string) => void;
  onMockSeedChange: (seed: string) => void;
  onLoadDemo: () => void;
  onGenerateMock: (listing: ListingDraft) => void;
  onClear: () => void;
}) {
  const makes = getCatalogueMakes();
  const models = getCatalogueModels(listing.make);
  const productionYears = getProductionYears(listing.make, listing.model);
  const productionMonths = getProductionMonths(
    listing.make,
    listing.model,
    listing.productionYear ?? 0,
  );
  const catalogueEntry = getCatalogueEntry(listing.make, listing.model);
  const availableVersions = getVersionsForProductionDate(
    listing.make,
    listing.model,
    listing.productionMonth ?? "",
    listing.productionYear ?? 0,
  );
  const hasDate = Boolean(listing.productionMonth && listing.productionYear);

  const updateCatalogueIdentity = (next: Partial<ListingDraft>) => {
    const candidate = { ...listing, ...next };
    const versions = getVersionsForProductionDate(
      candidate.make,
      candidate.model,
      candidate.productionMonth ?? "",
      candidate.productionYear ?? 0,
    );
    const versionStillValid = versions.some((version) => version.name === candidate.version);

    onListingChange({
      ...candidate,
      year: candidate.productionYear || candidate.year,
      version: versionStillValid ? candidate.version : "",
    });
  };

  const handleMakeChange = (make: string) => {
    const nextModel = getCatalogueModels(make)[0] ?? "";
    const years = getProductionYears(make, nextModel);
    const nextYear = years[years.length - 1] ?? undefined;
    const months = nextYear ? getProductionMonths(make, nextModel, nextYear) : [];

    updateCatalogueIdentity({
      make,
      model: nextModel,
      productionYear: nextYear,
      productionMonth: months[0] ?? "",
      fuelType: "",
      transmission: "",
      bodyType: "",
    });
  };

  const handleModelChange = (model: string) => {
    const years = getProductionYears(listing.make, model);
    const nextYear = years[years.length - 1] ?? undefined;
    const months = nextYear ? getProductionMonths(listing.make, model, nextYear) : [];

    updateCatalogueIdentity({
      model,
      productionYear: nextYear,
      productionMonth: months[0] ?? "",
      fuelType: "",
      transmission: "",
      bodyType: "",
    });
  };

  const handleProductionYearChange = (year: number) => {
    if (!Number.isFinite(year)) {
      updateCatalogueIdentity({
        productionYear: undefined,
        productionMonth: "",
      });
      return;
    }

    const months = getProductionMonths(listing.make, listing.model, year);
    const month = months.includes(listing.productionMonth ?? "")
      ? listing.productionMonth
      : months[0] ?? "";

    updateCatalogueIdentity({
      productionYear: year,
      productionMonth: month,
    });
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-panel border border-line bg-panel shadow-panel">
        <div className="grid md:grid-cols-[minmax(0,1fr)_310px]">
          <div className="px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                  Listing draft
                </p>
                <h2 className="mt-1 text-lg font-black text-ink">
                  Start from the guided demo or create a full sample listing
                </h2>
              </div>
              <Badge tone="neutral">Demo-safe</Badge>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <Field label="Demo draft">
                <select
                  value={selectedDemoId}
                  onChange={(event) => onSelectedDemoChange(event.target.value)}
                >
                  <option value="">Generated or custom listing</option>
                  {demoListings.map((demo) => (
                    <option key={demo.id} value={demo.id}>
                      {demo.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end gap-2">
                <Button type="button" onClick={onLoadDemo}>
                  <FileCheck2 className="size-3.5" aria-hidden="true" />
                  Load guided demo
                </Button>
                <Button type="button" variant="ghost" onClick={onClear} aria-label="Clear">
                  <Trash2 className="size-4" aria-hidden="true" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-line bg-raised px-4 py-4 md:border-l md:border-t-0">
            <TextInput
              label="Scenario"
              value={mockSeed}
              onChange={(event) => onMockSeedChange(event.target.value)}
              placeholder="zurich-demo-1"
              hint="Creates a complete Swiss draft with specs, equipment, images, and seller notes."
            />
            <Button
              type="button"
              className="mt-3 w-full"
              onClick={() => onGenerateMock(generateMockListing(mockSeed || "live-demo"))}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Create demo-ready listing
            </Button>
          </div>
        </div>
      </section>

      <InsertionSection
        title="Vehicle identification"
        eyebrow="Page 1"
        doctorSection="identify"
        actions={<Badge tone={hasDate ? "accent" : "warning"}>{hasDate ? "Date locked" : "Date needed"}</Badge>}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectInput
                label="Make"
                value={listing.make}
                onChange={(event) => handleMakeChange(event.target.value)}
                required
              >
                <option value="">Select make</option>
                {makes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </SelectInput>

              <SelectInput
                label="Model"
                value={listing.model}
                onChange={(event) => handleModelChange(event.target.value)}
                required
              >
                <option value="">Select model</option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </SelectInput>

              <SelectInput
                label="Production year"
                value={listing.productionYear ?? ""}
                onChange={(event) =>
                  handleProductionYearChange(Number.parseInt(event.target.value, 10))
                }
                required
              >
                <option value="">Select production year</option>
                {productionYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </SelectInput>

              <SelectInput
                label="Production month"
                value={listing.productionMonth ?? ""}
                onChange={(event) => updateCatalogueIdentity({ productionMonth: event.target.value })}
                required
              >
                <option value="">Select production month</option>
                {productionMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </SelectInput>
            </div>

            <div className="mt-4 rounded-[3px] border border-line bg-raised px-3 py-3">
              <div className="flex items-start gap-3">
                <CalendarRange className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <p className="text-sm font-black text-ink">Only valid catalogue production dates are selectable.</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    The selected production month and year determine available versions and the comparable-listing sample used later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-panel border border-line bg-raised p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                  Catalogue lock
                </p>
                <h3 className="mt-1 text-base font-black text-ink">
                  {listing.make || "Make"} {listing.model || "model"}
                </h3>
              </div>
              <Database className="size-5 text-muted" aria-hidden="true" />
            </div>

            <div className="mt-4 grid gap-2">
              <CatalogueFact
                icon={CarFront}
                label="Production window"
                value={
                  catalogueEntry
                    ? `${catalogueEntry.productionStart.month} ${catalogueEntry.productionStart.year} to ${catalogueEntry.productionEnd.month} ${catalogueEntry.productionEnd.year}`
                    : "Select make and model"
                }
              />
              <CatalogueFact
                icon={Layers3}
                label="Version candidates"
                value={
                  availableVersions.length
                    ? `${availableVersions.length} valid versions`
                    : "Choose a valid production date"
                }
              />
              <CatalogueFact
                icon={TrendingUp}
                label="Comparison pool"
                value={
                  hasDate
                    ? `${MOCK_PAST_LISTING_COUNT} comparable listings available`
                    : "Waiting for production date"
                }
              />
            </div>
          </aside>
        </div>
      </InsertionSection>
    </div>
  );
}

function CatalogueFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-[3px] border border-line bg-panel p-3">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
        <p className="mt-1 text-xs font-black leading-5 text-ink">{value}</p>
      </div>
    </div>
  );
}
