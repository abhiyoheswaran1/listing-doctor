"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  Circle,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { InsertionPage } from "@/lib/listing-doctor/flow";
import type { DescriptionStaleness } from "@/lib/listing-doctor/descriptionStaleness";
import { getActionDetailClassName } from "@/lib/listing-doctor/liveDoctorPanelClasses";
import type { ImpactLevel, ListingDraft, ListingReport } from "@/lib/listing-doctor/types";
import { cn } from "@/lib/utils";

type DoctorSection =
  | "identify"
  | "version"
  | "condition"
  | "price"
  | "standard-equipment"
  | "optional-equipment"
  | "retrofits"
  | "technical"
  | "battery"
  | "images"
  | "description";

type Tone = "neutral" | "success" | "warning" | "danger";

type CoachFocus = {
  icon: LucideIcon;
  label: string;
  title: string;
  detail: string;
  scoreValue: number;
};

type SectionAction = {
  title: string;
  detail: string;
  scoreLift?: number;
  complete?: boolean;
};

export function LiveDoctorPanel({
  listing,
  report,
  enabled = true,
  page = "details",
  hasStaleGeneratedDescription = false,
  descriptionStaleness = null,
}: {
  listing: ListingDraft;
  report: ListingReport | null;
  enabled?: boolean;
  page?: InsertionPage;
  hasStaleGeneratedDescription?: boolean;
  descriptionStaleness?: DescriptionStaleness | null;
}) {
  const hasVersion = Boolean(listing.make && listing.model && listing.version);
  const [activeSection, setActiveSection] = useState<DoctorSection>("identify");

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const sections = Array.from(
          document.querySelectorAll<HTMLElement>("[data-doctor-section]"),
        );
        const anchor = window.innerHeight * 0.34;
        const nearest = sections
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              id: element.dataset.doctorSection as DoctorSection,
              distance: Math.abs(rect.top - anchor),
              visible: rect.bottom > 96 && rect.top < window.innerHeight - 80,
            };
          })
          .filter((item) => item.visible)
          .sort((a, b) => a.distance - b.distance)[0];

        if (nearest?.id) setActiveSection(nearest.id);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  if (!hasVersion || !enabled) {
    return (
      <aside className="self-start xl:sticky xl:top-3">
        <div className="overflow-hidden rounded-panel border border-line bg-panel shadow-panel">
          <AssistantTopBar status="Waiting" tone="neutral" />
          <div className="space-y-5 p-4">
            <div>
              <p className="text-xl font-black leading-tight text-ink">
                {getPreLiveTitle(page, hasVersion)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Listing Coach starts once the car has a precise catalogue identity.
              </p>
            </div>

            <div className="space-y-2">
              <SetupStep
                done={Boolean(listing.make && listing.model && listing.productionMonth && listing.productionYear)}
                label="Catalogue identity"
                value={listing.make && listing.model ? `${listing.make} ${listing.model}` : "Select make and model"}
              />
              <SetupStep done={hasVersion} label="Exact version" value={listing.version || "Pick a version"} />
              <SetupStep done={enabled && hasVersion} label="Live coaching" value="Starts on listing data" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (!report) {
    return (
      <aside className="self-start xl:sticky xl:top-3">
        <div className="overflow-hidden rounded-panel border border-line bg-panel shadow-panel">
          <AssistantTopBar status="Checking" tone="neutral" />
          <div className="p-4">
            <p className="text-xl font-black leading-tight text-ink">Checking the current draft</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Keep editing. Listing Coach updates after each change.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <ActiveAssistant
      activeSection={activeSection}
      listing={listing}
      report={report}
      hasStaleGeneratedDescription={hasStaleGeneratedDescription}
      descriptionStaleness={descriptionStaleness}
    />
  );
}

function ActiveAssistant({
  activeSection,
  listing,
  report,
  hasStaleGeneratedDescription,
  descriptionStaleness,
}: {
  activeSection: DoctorSection;
  listing: ListingDraft;
  report: ListingReport;
  hasStaleGeneratedDescription: boolean;
  descriptionStaleness: DescriptionStaleness | null;
}) {
  const focus = getFocus(activeSection, listing, report);
  const sectionAction = getSectionAction(activeSection, listing, report);
  const readinessTone = getReadinessTone(report);

  return (
    <aside className="self-start xl:sticky xl:top-3">
      <div className="doctor-viewport-panel flex overflow-hidden rounded-panel border border-line bg-panel shadow-panel">
        <div className="flex min-h-0 w-full flex-col">
          <AssistantTopBar status={shortReadiness(report.readiness)} tone={readinessTone} />

          <div className="doctor-panel-body flex min-h-0 flex-col gap-3 p-3">
            <HealthSummary report={report} />

            <FocusSection focus={focus} />

            {hasStaleGeneratedDescription && descriptionStaleness?.isStale ? (
              <StaleDescriptionMini staleness={descriptionStaleness} />
            ) : null}

            <NextAction action={sectionAction} />

            <PredictivePulse report={report} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function HealthSummary({
  report,
}: {
  report: ListingReport;
}) {
  return (
    <section className="rounded-[4px] border border-line bg-raised p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
            Live score
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-black leading-none text-ink">
              {report.scores.overall}
            </span>
            <span className="pb-1 text-xs font-black uppercase tracking-[0.08em] text-muted">
              /100
            </span>
          </div>
        </div>
        <ReadinessPill readiness={report.readiness} />
      </div>
      <Progress
        value={report.scores.overall}
        tone={scoreTone(report.scores.overall)}
        className="mt-3 h-1.5"
      />
    </section>
  );
}

function AssistantTopBar({ status, tone }: { status: string; tone: Tone }) {
  return (
    <div className="border-b border-line bg-panel px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[3px] bg-accent text-accent-ink">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-none text-ink">Listing Coach</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
              Follows your form
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-[3px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.06em]",
            toneClasses(tone),
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function FocusSection({ focus }: { focus: CoachFocus }) {
  const Icon = focus.icon;
  const tone = scoreTone(focus.scoreValue);

  return (
    <section className="rounded-[4px] border border-line bg-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[3px] border border-line bg-raised">
            <Icon className="size-4 text-ink" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
              Now checking
            </p>
            <p className="text-base font-black leading-tight text-ink">{focus.label}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-[3px] border border-line bg-raised px-2 py-1 text-xs font-black text-ink">
          {focus.scoreValue}
        </span>
      </div>
      <Progress value={focus.scoreValue} tone={tone} className="mt-3 h-1.5" />
      <div>
        <p className="text-sm font-black leading-5 text-ink">{focus.title}</p>
        <p className="doctor-focus-detail mt-1 text-xs leading-5 text-muted">{focus.detail}</p>
      </div>
    </section>
  );
}

function StaleDescriptionMini({ staleness }: { staleness: DescriptionStaleness }) {
  return (
    <section className="rounded-[4px] border border-warning/40 bg-warning/10 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
        <div>
          <p className="text-xs font-black text-ink">Generated copy needs review</p>
          <p className="doctor-priority-detail mt-1 line-clamp-2 text-xs font-semibold leading-5 text-muted">
            {staleness.summary}
          </p>
        </div>
      </div>
    </section>
  );
}

function PredictivePulse({ report }: { report: ListingReport }) {
  const insights = report.predictiveInsights;

  return (
    <section className="doctor-secondary rounded-[4px] border border-line bg-raised p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
            Evidence
          </p>
          <p className="mt-1 text-sm font-black leading-5 text-ink">
            {insights.expectedLeadImpact} enquiry lift after top fixes
          </p>
        </div>
        <span className={cn("rounded-[3px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.06em]", confidenceTone(insights.confidence))}>
          {insights.confidence}
        </span>
      </div>
      <p className="doctor-microcopy mt-2 text-xs font-semibold leading-5 text-muted">
        Compared with {insights.comparableCount} similar listings. {insights.expectedTimeToFirstContact}.
      </p>
    </section>
  );
}

function NextAction({ action }: { action: SectionAction }) {
  if (action.complete) {
    return (
      <section className="rounded-[4px] border border-success/30 bg-success/10 p-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="text-sm font-black text-ink">{action.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {action.detail}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[4px] border border-warning/40 bg-warning/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent-ink" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
              Recommended action
            </p>
            <p className="mt-1 text-sm font-black leading-5 text-ink">{action.title}</p>
            <p className={getActionDetailClassName()}>{action.detail}</p>
          </div>
        </div>
        {action.scoreLift ? (
          <span className="shrink-0 rounded-[3px] border border-success/30 bg-success/10 px-2 py-1 text-xs font-black text-success">
            +{action.scoreLift}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function SetupStep({ done, label, value }: { done: boolean; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-t border-line pt-3 first:border-t-0 first:pt-0">
      {done ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
        <p className="truncate text-xs font-black text-ink">{value}</p>
      </div>
    </div>
  );
}

function ReadinessPill({ readiness }: { readiness: ListingReport["readiness"] }) {
  const tone = readiness === "Ready to publish"
    ? "success"
    : readiness === "High risk, fix first"
      ? "danger"
      : "warning";

  return (
    <span
      className={cn(
        "rounded-[3px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em]",
        toneClasses(tone),
      )}
    >
      {shortReadiness(readiness)}
    </span>
  );
}

function getFocus(section: DoctorSection, listing: ListingDraft, report: ListingReport): CoachFocus {
  if (section === "condition") {
    return {
      icon: ShieldCheck,
      label: "Trust proof",
      title: report.missingTrustSignals[0] ?? "Trust signals look covered.",
      detail: "MFK, service history, accident status, and warranty carry buyer confidence.",
      scoreValue: report.scores.trust,
    };
  }

  if (section === "price") {
    return {
      icon: TrendingUp,
      label: "Price position",
      title:
        report.pricingFeedback.position === "within"
          ? "Price sits inside the benchmark band."
          : "Price needs a clear explanation.",
      detail: `Benchmark: CHF ${formatChf(report.pricingFeedback.benchmarkLow)} to CHF ${formatChf(
        report.pricingFeedback.benchmarkHigh,
      )}.`,
      scoreValue: report.scores.marketPosition ?? 0,
    };
  }

  if (section === "standard-equipment" || section === "optional-equipment" || section === "retrofits") {
    return {
      icon: ListChecks,
      label: "Equipment",
      title: `${(listing.standardEquipment ?? []).length + (listing.optionalEquipment ?? []).length} equipment items selected.`,
      detail: "Confirm the catalogue standard equipment and select only optional equipment this car actually has.",
      scoreValue: report.scores.equipment ?? 0,
    };
  }

  if (section === "technical") {
    return {
      icon: Wrench,
      label: "Technical data",
      title: "Complete specs reduce buyer back-and-forth.",
      detail: "Power, dimensions, weight, type approval, VIN, and energy label make the listing feel official.",
      scoreValue: report.scores.technicalData ?? 0,
    };
  }

  if (section === "battery") {
    return {
      icon: Zap,
      label: "Battery proof",
      title: report.scores.batteryData === 100 ? "Battery data looks complete." : "Battery proof matters most for EVs.",
      detail: "Add warranty, battery health, charging cable, plugs, charging speed, and realistic range.",
      scoreValue: report.scores.batteryData ?? 0,
    };
  }

  if (section === "images") {
    return {
      icon: Camera,
      label: "Photo coverage",
      title: report.photoImprovements[0] ?? "Photo walkthrough looks complete.",
      detail: "Show exterior, interior, dashboard, odometer, tyres, service book, and damage proof when relevant.",
      scoreValue: report.scores.photoCompleteness,
    };
  }

  if (section === "description") {
    return {
      icon: FileText,
      label: "Description",
      title: report.descriptionFeedback[0] ?? "Description is doing its job.",
      detail: "Use proof, not generic claims: condition, documentation, defects, equipment, and handover details.",
      scoreValue: report.scores.descriptionQuality,
    };
  }

  return {
    icon: Car,
    label: "Vehicle identity",
    title: listing.version ? "Vehicle identity is locked." : "Pick the exact version.",
    detail: "Make, model, version, production date, registration, mileage, body, and drivetrain anchor the scoring.",
    scoreValue: report.scores.vehicleData ?? 0,
  };
}

function getSectionAction(
  section: DoctorSection,
  listing: ListingDraft,
  report: ListingReport,
): SectionAction {
  if (section === "condition") {
    const trustFix = report.topFixes.find((fix) => /MFK|trust|service|accident|warranty/i.test(fix.title));
    if (trustFix) return toSectionAction(trustFix);

    return {
      title: "Trust proof is covered",
      detail: "Keep MFK, service, accident, and warranty proof visible in the listing and photos.",
      complete: true,
    };
  }

  if (section === "price") {
    if (report.pricingFeedback.position !== "within") {
      return {
        title: "Explain the price position",
        detail: report.pricingFeedback.concern,
        scoreLift: 8,
      };
    }

    return {
      title: "Price is inside the benchmark",
      detail: "No price action needed in this section. Keep the price aligned with the listing proof.",
      complete: true,
    };
  }

  if (section === "images") {
    if (report.photoImprovements[0]) {
      return {
        title: "Add the missing proof photo",
        detail: report.photoImprovements[0],
        scoreLift: 10,
      };
    }

    return {
      title: "Photo walkthrough is covered",
      detail: "Exterior, interior, dashboard, odometer, tyre, service, and relevant damage proof are visible.",
      complete: true,
    };
  }

  if (section === "description") {
    if (report.descriptionFeedback[0]) {
      return {
        title: "Improve the description proof",
        detail: report.descriptionFeedback[0],
        scoreLift: 8,
      };
    }

    return {
      title: "Description is strong enough",
      detail: "The copy includes searchable facts and proof buyers usually check before contacting.",
      complete: true,
    };
  }

  if (section === "standard-equipment" || section === "optional-equipment" || section === "retrofits") {
    const selectedOptional = listing.optionalEquipment?.length ?? 0;
    const selectedStandard = listing.standardEquipment?.length ?? 0;
    if ((report.scores.equipment ?? 0) < 80) {
      return {
        title: "Confirm equipment accurately",
        detail: "Keep catalogue standard equipment selected and add only optional equipment this vehicle actually has.",
        scoreLift: 6,
      };
    }

    return {
      title: "Equipment section looks consistent",
      detail: `${selectedStandard} standard and ${selectedOptional} optional items are selected for this version.`,
      complete: true,
    };
  }

  if (section === "technical") {
    if ((report.scores.technicalData ?? 0) < 80) {
      return {
        title: "Complete the official data",
        detail: "Add power, energy label, type approval, VIN, dimensions, or weight where available.",
        scoreLift: 5,
      };
    }

    return {
      title: "Technical data is covered",
      detail: "The section has enough official data for buyers and marketplace checks.",
      complete: true,
    };
  }

  if (section === "battery") {
    if ((report.scores.batteryData ?? 0) < 80) {
      return {
        title: "Add EV battery proof",
        detail: "Battery health, warranty, charging cable, plug type, charging power, and range reduce EV buyer hesitation.",
        scoreLift: 8,
      };
    }

    return {
      title: "Battery proof is covered",
      detail: "EV buyers can see the core battery and charging information.",
      complete: true,
    };
  }

  return {
    title: "Complete this step",
    detail: "Lock the catalogue identity and version before live coaching can score the listing data reliably.",
    complete: report.scores.vehicleData ? report.scores.vehicleData >= 80 : false,
  };
}

function toSectionAction(fix: { title: string; detail: string; impact: ImpactLevel; scoreLift: number }): SectionAction {
  return {
    title: fix.title,
    detail: fix.detail,
    scoreLift: fix.scoreLift,
  };
}

function getPreLiveTitle(page: InsertionPage, hasVersion: boolean) {
  if (page === "identify") return "Identify the car first";
  if (page === "version") return hasVersion ? "Ready for listing data" : "Pick the exact version";
  return "Complete identity first";
}

function getReadinessTone(report: ListingReport): Tone {
  if (report.readiness === "Ready to publish") return "success";
  if (report.readiness === "High risk, fix first") return "danger";
  return "warning";
}

function scoreTone(value: number) {
  if (value >= 80) return "success";
  if (value >= 55) return "warning";
  return "danger";
}

function toneClasses(tone: Tone) {
  if (tone === "success") return "border-success/30 bg-success/10 text-success";
  if (tone === "warning") return "border-warning/40 bg-warning/15 text-accent-ink";
  if (tone === "danger") return "border-danger/30 bg-danger/10 text-danger";
  return "border-line bg-raised text-muted";
}

function confidenceTone(confidence: ListingReport["predictiveInsights"]["confidence"]) {
  if (confidence === "High") return "border-success/30 bg-success/10 text-success";
  if (confidence === "Medium") return "border-warning/40 bg-warning/15 text-accent-ink";
  return "border-line bg-raised text-muted";
}

function shortReadiness(value: ListingReport["readiness"]) {
  if (value === "Ready to publish") return "Ready";
  if (value === "High risk, fix first") return "High risk";
  return "Improve";
}

function formatChf(value: number) {
  return new Intl.NumberFormat("de-CH").format(value);
}
