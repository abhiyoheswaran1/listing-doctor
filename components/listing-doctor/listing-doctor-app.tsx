"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Stethoscope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoListings, emptyListingDraft } from "@/lib/listing-doctor/demoListings";
import {
  type DescriptionAssistantMode,
  generateListingDescription,
} from "@/lib/listing-doctor/descriptionAssistant";
import {
  createDescriptionSnapshot,
  getDescriptionStaleness,
  type DescriptionSnapshot,
  type DescriptionStaleness,
} from "@/lib/listing-doctor/descriptionStaleness";
import {
  getInsertionFlowState,
  insertionPages,
  type InsertionPage,
} from "@/lib/listing-doctor/flow";
import type {
  ApiErrorResponse,
  ListingDraft,
  ListingReport,
  StructuredDiagnosisResponse,
} from "@/lib/listing-doctor/types";
import { cn } from "@/lib/utils";

import { DiagnosisPanel } from "./diagnosis-panel";
import { ListingEditor } from "./listing-editor";
import { LiveDoctorPanel } from "./live-doctor-panel";

type CopyTarget = "description" | "checklist";
type DiagnosisStatus = "idle" | "loading" | "success" | "error";

export function ListingDoctorApp() {
  const [selectedDemoId, setSelectedDemoId] = useState(demoListings[0]?.id ?? "");
  const [listing, setListing] = useState<ListingDraft>(() => cloneListing(demoListings[0]));
  const [mockSeed, setMockSeed] = useState("zurich-demo-1");
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);
  const [activePage, setActivePage] = useState<InsertionPage>("identify");
  const [manualReport, setManualReport] = useState<ListingReport | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [diagnosisStatus, setDiagnosisStatus] = useState<DiagnosisStatus>("idle");
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [descriptionSnapshot, setDescriptionSnapshot] = useState<DescriptionSnapshot | null>(null);
  const [descriptionTouchedAfterGeneration, setDescriptionTouchedAfterGeneration] = useState(false);
  const [staleDescriptionWarningVisible, setStaleDescriptionWarningVisible] = useState(false);
  const [allowStaleDescription, setAllowStaleDescription] = useState(false);

  const completion = useMemo(() => {
    const required = [
      listing.make,
      listing.model,
      listing.year > 1900 ? "year" : "",
      listing.priceChf > 0 ? "price" : "",
      listing.mileageKm > 0 ? "mileage" : "",
      listing.fuelType,
      listing.transmission,
      listing.bodyType,
      listing.description,
    ];

    return Math.round((required.filter(Boolean).length / required.length) * 100);
  }, [listing]);

  const flowState = useMemo(
    () => getInsertionFlowState({ listing, activePage, completion }),
    [activePage, completion, listing],
  );
  const descriptionStaleness = useMemo(
    () => getDescriptionStaleness(listing, descriptionSnapshot),
    [descriptionSnapshot, listing],
  );
  const hasStaleGeneratedDescription = Boolean(
    descriptionSnapshot &&
      !descriptionTouchedAfterGeneration &&
      listing.description === descriptionSnapshot.description &&
      descriptionStaleness.isStale,
  );
  const shouldPauseForStaleDescription = hasStaleGeneratedDescription && !allowStaleDescription;

  const diagnoseListing = useCallback(
    async (currentListing: ListingDraft, signal?: AbortSignal) => {
      setDiagnosisStatus("loading");
      setDiagnosisError(null);

      try {
        const response = await fetch("/api/diagnose-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing: currentListing }),
          signal,
        });
        const payload = (await response.json()) as StructuredDiagnosisResponse | ApiErrorResponse;

        if (!response.ok || "error" in payload) {
          const details = "details" in payload && payload.details?.length
            ? ` ${payload.details.join(" ")}`
            : "";
          throw new Error(`${"error" in payload ? payload.error : "Failed to diagnose listing"}.${details}`);
        }

        setManualReport(payload.diagnosis);
        setDiagnosisStatus("success");
      } catch (error) {
        if (signal?.aborted) return;
        setManualReport(null);
        setDiagnosisStatus("error");
        setDiagnosisError(error instanceof Error ? error.message : "Failed to diagnose listing");
      }
    },
    [],
  );

  useEffect(() => {
    if (activePage !== "details") setShowFullReport(false);
  }, [activePage]);

  useEffect(() => {
    setAllowStaleDescription(false);
    setStaleDescriptionWarningVisible(false);
  }, [descriptionStaleness.summary]);

  useEffect(() => {
    if (!listing.make || !listing.model) {
      setManualReport(null);
      setDiagnosisStatus("idle");
      setDiagnosisError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void diagnoseListing(listing, controller.signal);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [diagnoseListing, listing]);

  const loadDemo = () => {
    const demo = demoListings.find((item) => item.id === selectedDemoId) ?? demoListings[0];
    setListing(cloneListing(demo));
    setActivePage("identify");
    resetDescriptionGenerationState();
  };

  const generateMock = (mockListing: ListingDraft) => {
    setListing(cloneListing(mockListing));
    setSelectedDemoId("");
    setActivePage("identify");
    resetDescriptionGenerationState();
  };

  const clear = () => {
    setListing(cloneListing(emptyListingDraft));
    setSelectedDemoId("");
    setActivePage("identify");
    resetDescriptionGenerationState();
  };

  const copy = async (target: CopyTarget, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedTarget(target);
      window.setTimeout(() => setCopiedTarget(null), 1800);
    } catch {
      setCopiedTarget(null);
    }
  };

  const handleContinue = () => {
    if (activePage === "details" && shouldPauseForStaleDescription) {
      setStaleDescriptionWarningVisible(true);
      return;
    }

    if (flowState.nextPage) setActivePage(flowState.nextPage);
  };

  const handleDiagnoseClick = () => {
    if (activePage === "details" && shouldPauseForStaleDescription) {
      setStaleDescriptionWarningVisible(true);
      return;
    }

    void diagnoseListing(listing);
  };

  const handleBack = () => {
    if (flowState.previousPage) setActivePage(flowState.previousPage);
  };

  const handleDescriptionGenerated = (
    mode: DescriptionAssistantMode,
    generatedDescription: string,
  ) => {
    setDescriptionSnapshot(createDescriptionSnapshot(listing, mode, generatedDescription));
    setDescriptionTouchedAfterGeneration(false);
    setAllowStaleDescription(false);
    setStaleDescriptionWarningVisible(false);
  };

  const refreshGeneratedDescription = () => {
    if (!descriptionSnapshot) return;

    const result = generateListingDescription(listing, descriptionSnapshot.mode);
    const nextListing = { ...listing, description: result.description };

    setListing(nextListing);
    setDescriptionSnapshot(
      createDescriptionSnapshot(nextListing, descriptionSnapshot.mode, result.description),
    );
    setDescriptionTouchedAfterGeneration(false);
    setAllowStaleDescription(false);
    setStaleDescriptionWarningVisible(false);
  };

  const continueWithStaleDescription = () => {
    setAllowStaleDescription(true);
    setStaleDescriptionWarningVisible(false);
    if (flowState.nextPage) setActivePage(flowState.nextPage);
  };

  const reviewDescriptionText = () => {
    setActivePage("details");
    setStaleDescriptionWarningVisible(false);
    window.setTimeout(() => {
      document
        .querySelector<HTMLElement>('[data-doctor-section="description"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  function resetDescriptionGenerationState() {
    setDescriptionSnapshot(null);
    setDescriptionTouchedAfterGeneration(false);
    setStaleDescriptionWarningVisible(false);
    setAllowStaleDescription(false);
  }

  return (
    <main className="min-h-screen bg-base text-ink">
      <div className="border-b border-line bg-panel">
        <div className="mx-auto flex min-h-14 max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 items-center rounded-[3px] border border-accent bg-accent px-3 text-sm font-black text-accent-ink shadow-sm">
              AutoScout24
            </div>
            <div className="h-8 w-px bg-line" />
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-ink" aria-hidden="true" />
              <div>
                <p className="text-sm font-black leading-none text-ink">Listing Doctor</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                  Your listing&apos;s conversion coach
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] px-3 py-4 sm:px-6">
        <header className="mb-4 overflow-hidden rounded-panel border border-line bg-panel shadow-panel">
          <div className="border-b border-line bg-raised px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                Seller insertion flow with real-time Listing Doctor coaching.
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[11px] shadow-none"
                  onClick={handleDiagnoseClick}
                  disabled={diagnosisStatus === "loading" || !listing.make || !listing.model}
                >
                  {diagnosisStatus === "loading" ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="size-3" aria-hidden="true" />
                  )}
                  Diagnose
                </Button>
                <Badge
                  tone={activePage === "details" ? "accent" : "neutral"}
                  className="h-7 whitespace-nowrap px-2 text-[10px]"
                >
                  {`Page ${insertionPages.findIndex((page) => page.id === activePage) + 1} of 3`}
                </Badge>
              </div>
            </div>
            <div className="mt-2">
              <div>
                <h1 className="text-[28px] font-black leading-none tracking-normal text-ink">
                  Insert vehicle data
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  {getHeaderCopy(activePage)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-0 md:grid-cols-3">
            {insertionPages.map((step, index) => {
              const active = step.id === activePage;
              const done = flowState.isPageComplete(step.id);
              const enabled = flowState.canOpenPage(step.id);

              return (
                <WorkflowStepButton
                  key={step.id}
                  active={active}
                  done={done}
                  enabled={enabled}
                  index={index}
                  label={step.label}
                  detail={step.detail}
                  onClick={() => enabled && setActivePage(step.id)}
                />
              );
            })}
          </div>
        </header>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,830px)_440px]">
          <section aria-label="Draft listing editor">
            {diagnosisError ? (
              <div className="mb-3 flex gap-2 rounded-[3px] border border-danger/30 bg-danger/10 p-2 text-xs font-bold leading-5 text-danger">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>{diagnosisError}</span>
              </div>
            ) : null}
            {activePage === "details" &&
            hasStaleGeneratedDescription &&
            staleDescriptionWarningVisible ? (
              <div className="mb-3">
                <DescriptionStalenessNotice
                  staleness={descriptionStaleness}
                  onRefresh={refreshGeneratedDescription}
                  onContinue={continueWithStaleDescription}
                  onReview={reviewDescriptionText}
                />
              </div>
            ) : null}

            <ListingEditor
              page={activePage}
              listing={listing}
              selectedDemoId={selectedDemoId}
              mockSeed={mockSeed}
              onListingChange={setListing}
              onSelectedDemoChange={setSelectedDemoId}
              onMockSeedChange={setMockSeed}
              onLoadDemo={loadDemo}
              onGenerateMock={generateMock}
              onClear={clear}
              onDescriptionGenerated={handleDescriptionGenerated}
              onDescriptionManuallyEdited={() => {
                setDescriptionTouchedAfterGeneration(true);
                setStaleDescriptionWarningVisible(false);
              }}
              descriptionStaleness={
                hasStaleGeneratedDescription ? descriptionStaleness : null
              }
              onRefreshGeneratedDescription={refreshGeneratedDescription}
            />

            {activePage === "details" ? (
              <div className="mt-4">
                <ReportReveal
                  report={manualReport}
                  open={showFullReport}
                  onToggle={() => setShowFullReport((value) => !value)}
                  copiedTarget={copiedTarget}
                  onCopy={copy}
                />
              </div>
            ) : null}
          </section>

          <LiveDoctorPanel
            listing={listing}
            report={manualReport}
            enabled={activePage === "details"}
            page={activePage}
            hasStaleGeneratedDescription={hasStaleGeneratedDescription}
            descriptionStaleness={descriptionStaleness}
          />
        </div>

        <div className="sticky bottom-0 z-20 mt-5 flex items-center justify-between gap-3 border border-line bg-panel/95 px-3 py-3 shadow-panel backdrop-blur">
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
            disabled={!flowState.previousPage}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden text-xs font-bold text-muted sm:inline">
              {activePage === "details" && hasStaleGeneratedDescription
                ? `Generated description may be stale: ${descriptionStaleness.summary}`
                : activePage === "details"
                ? getFooterDiagnosisText(manualReport, diagnosisStatus)
                : flowState.footerStatus}
            </span>
            <Button
              type="button"
              variant="primary"
              onClick={handleContinue}
              disabled={!flowState.canContinue}
            >
              {flowState.continueLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function DescriptionStalenessNotice({
  staleness,
  onRefresh,
  onContinue,
  onReview,
}: {
  staleness: DescriptionStaleness;
  onRefresh: () => void;
  onContinue: () => void;
  onReview: () => void;
}) {
  return (
    <div className="mt-3 rounded-[3px] border border-warning/40 bg-warning/10 p-3">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
        <div>
          <p className="text-xs font-black text-ink">Generated description may be stale</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted">
            {staleness.summary || "Important source fields changed after the description was generated."}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onRefresh}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Refresh description
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onReview}>
          Review text
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onContinue}>
          Continue anyway
        </Button>
      </div>
    </div>
  );
}

function ReportReveal({
  report,
  open,
  onToggle,
  copiedTarget,
  onCopy,
}: {
  report: ListingReport | null;
  open: boolean;
  onToggle: () => void;
  copiedTarget: CopyTarget | null;
  onCopy: (target: CopyTarget, value: string) => void;
}) {
  if (!report) return null;

  return (
    <>
      <div className="rounded-panel border border-line bg-panel shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[3px] border border-line bg-raised">
              <ClipboardCheck className="size-4 text-muted" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-ink">Full quality report</p>
              <p className="mt-1 text-xs font-semibold text-muted">
                Score {report.scores.overall}, {report.readiness.toLowerCase()}
              </p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={onToggle}>
            {open ? "Hide report" : "Review report"}
          </Button>
        </div>
      </div>
      {open ? (
        <div className="mt-3">
          <DiagnosisPanel
            report={report}
            copiedTarget={copiedTarget}
            onCopy={onCopy}
            compact={false}
          />
        </div>
      ) : null}
    </>
  );
}

function WorkflowStepButton({
  active,
  done,
  enabled,
  index,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  done: boolean;
  enabled: boolean;
  index: number;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={cn(
        "relative flex min-h-[92px] min-w-0 items-start gap-3 border-b border-line px-4 py-3 text-left transition md:border-b-0 md:border-r last:md:border-r-0",
        active ? "bg-panel" : enabled ? "bg-raised hover:bg-panel" : "bg-raised opacity-60",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          active ? "bg-accent" : done ? "bg-success" : "bg-transparent",
        )}
      />
      <span
        className={cn(
          "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-black",
          active
            ? "border-accent bg-accent text-accent-ink shadow-sm"
            : done
              ? "border-success bg-success text-panel"
              : "border-line bg-panel text-muted",
        )}
      >
        {done && !active ? <Check className="size-4" aria-hidden="true" /> : index + 1}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-sm font-black", active ? "text-ink" : "text-muted")}>
          {label}
        </span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-muted">{detail}</span>
      </span>
    </button>
  );
}

function getHeaderCopy(page: InsertionPage) {
  if (page === "identify") {
    return "Start with a catalogue-backed vehicle identity. Production month and year decide which versions and benchmark records are valid.";
  }

  if (page === "version") {
    return "Pick the exact catalogue version before entering listing data. This anchors drivetrain, body type, and comparison logic.";
  }

  return "Your listing's conversion coach checks trust, photos, searchability, and price while you enter the draft.";
}

function getFooterDiagnosisText(report: ListingReport | null, status: DiagnosisStatus) {
  if (report) return `Live score ${report.scores.overall}, ${report.readiness.toLowerCase()}`;
  if (status === "loading") return "Diagnosing listing through API";
  if (status === "error") return "Diagnosis API returned an error";
  return "Diagnosis pending";
}

function cloneListing(listing: ListingDraft | undefined): ListingDraft {
  return JSON.parse(JSON.stringify(listing ?? emptyListingDraft)) as ListingDraft;
}
