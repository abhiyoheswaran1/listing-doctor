"use client";

import {
  CalendarRange,
  CheckCircle2,
  CircleDot,
  Cog,
  Fuel,
  Gauge,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getVersionsForProductionDate } from "@/lib/listing-doctor/catalogue";
import type { CatalogueVersion } from "@/lib/listing-doctor/catalogue";
import type { ListingDraft } from "@/lib/listing-doctor/types";
import { cn } from "@/lib/utils";

import { InsertionSection } from "./insertion-section";

export function VersionPage({
  listing,
  onListingChange,
}: {
  listing: ListingDraft;
  onListingChange: (listing: ListingDraft) => void;
}) {
  const versions = getVersionsForProductionDate(
    listing.make,
    listing.model,
    listing.productionMonth ?? "",
    listing.productionYear ?? 0,
  );
  const selectedVersion = versions.find((version) => version.name === listing.version);

  const selectVersion = (version: CatalogueVersion) => {
    onListingChange({
      ...listing,
      version: version.name,
      fuelType: version.fuelType,
      transmission: version.transmission,
      bodyType: version.bodyType,
    });
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-panel border border-line bg-panel shadow-panel">
        <div className="grid md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="px-4 py-4 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              Catalogue identity
            </p>
            <h2 className="mt-1 text-xl font-black text-ink">
              {listing.make || "Select make"} {listing.model || ""}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Production date: {listing.productionMonth || "month missing"}{" "}
              {listing.productionYear || "year missing"}. The version list is filtered by this
              catalogue window before the seller enters listing data.
            </p>
          </div>
          <div className="border-t border-line bg-raised px-4 py-4 md:border-l md:border-t-0">
            <div className="flex items-center gap-2">
              <CalendarRange className="size-4 text-muted" aria-hidden="true" />
              <p className="text-xs font-black text-ink">Version gate</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Exact version fills fuel type, transmission, body type, and benchmark context.
            </p>
            <div className="mt-3">
              <Badge tone={versions.length ? "accent" : "warning"}>{versions.length} matches</Badge>
            </div>
          </div>
        </div>
      </section>

      <InsertionSection
        title="Pick exact version"
        eyebrow="Page 2"
        doctorSection="version"
        actions={
          <Badge tone={selectedVersion ? "accent" : "warning"}>
            {selectedVersion ? "Version selected" : "Selection needed"}
          </Badge>
        }
      >
        {versions.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {versions.map((version) => {
              const selected = listing.version === version.name;

              return (
                <button
                  key={version.name}
                  type="button"
                  onClick={() => selectVersion(version)}
                  className={cn(
                    "group min-h-[190px] rounded-panel border p-4 text-left shadow-sm transition",
                    selected
                      ? "border-accent bg-accent/20"
                      : "border-line bg-panel hover:border-muted hover:bg-raised",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                        Catalogue version
                      </p>
                      <h3 className="mt-1 text-base font-black leading-5 text-ink">
                        {version.name}
                      </h3>
                    </div>
                    {selected ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
                    ) : (
                      <CircleDot className="size-5 shrink-0 text-muted" aria-hidden="true" />
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <VersionFact icon={Fuel} label="Fuel" value={version.fuelType} />
                    <VersionFact icon={Cog} label="Transmission" value={version.transmission} />
                    <VersionFact icon={Gauge} label="Body type" value={version.bodyType} />
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-muted">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    <span>Valid for selected production month and year</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[3px] border border-warning/45 bg-warning/10 p-4">
            <p className="text-sm font-black text-ink">No version for this production date.</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Go back and choose a production month and year that exists in the catalogue.
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ReadinessCard
            icon={Gauge}
            label="Benchmark readiness"
            value={
              selectedVersion
                ? "Ready for price comparison on page 3"
                : "Waiting for exact version"
            }
          />
          <ReadinessCard
            icon={ShieldCheck}
            label="Doctor state"
            value={
              selectedVersion
                ? "Live coaching unlocks on listing data"
                : "Doctor remains locked until version is selected"
            }
          />
        </div>
      </InsertionSection>
    </div>
  );
}

function VersionFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[3px] border border-line bg-raised px-2.5 py-2">
      <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-muted">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </span>
      <span className="shrink-0 text-xs font-black text-ink">{value}</span>
    </div>
  );
}

function ReadinessCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[3px] border border-line bg-raised p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted" aria-hidden="true" />
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
      </div>
      <p className="mt-2 text-sm font-black leading-5 text-ink">{value}</p>
    </div>
  );
}
