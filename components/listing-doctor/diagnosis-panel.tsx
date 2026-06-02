"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Copy,
  Gauge,
  HelpCircle,
  ImagePlus,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ListingReport } from "@/lib/listing-doctor/types";

type CopyTarget = "description" | "checklist";

export function DiagnosisPanel({
  report,
  copiedTarget,
  onCopy,
  compact = true,
}: {
  report: ListingReport | null;
  copiedTarget: CopyTarget | null;
  onCopy: (target: CopyTarget, value: string) => void;
  compact?: boolean;
}) {
  if (!report) {
    return (
      <aside className="lg:sticky lg:top-4">
        <div className="rounded-panel border border-line bg-panel shadow-panel">
          <div className="border-b border-line bg-raised px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              Listing Coach
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-ink">
              Coach waits for your draft.
            </h2>
          </div>
          <div className="space-y-4 p-4">
            <div className="rounded border border-dashed border-line bg-raised p-4">
              <p className="text-sm leading-6 text-muted">
                Refresh the score to check trust, description quality, photo coverage,
                searchability, and pricing readiness.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Trust", "Photos", "Description", "Search"].map((label) => (
                <div key={label} className="rounded border border-line bg-raised p-3">
                  <div className="h-2 w-12 rounded bg-line" />
                  <p className="mt-3 text-xs font-bold text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const readinessTone =
    report.readiness === "Ready to publish"
      ? "success"
      : report.readiness === "High risk, fix first"
        ? "danger"
        : "warning";

  const checklistText = report.finalPrePublishChecklist.map((item) => `- ${item}`).join("\n");

  return (
    <aside className={compact ? "space-y-3 lg:sticky lg:top-4" : "space-y-3"}>
      <div className="rounded-panel border border-line bg-panel shadow-panel">
        <div className="border-b border-line bg-raised px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                Listing Coach report
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-ink">Quality report</h2>
            </div>
            <Badge tone={readinessTone}>{report.readiness}</Badge>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-[150px_1fr] lg:grid-cols-1 xl:grid-cols-[150px_1fr]">
            <div className="flex aspect-square items-center justify-center rounded-panel border border-line bg-raised">
              <div className="text-center">
                <div className="text-5xl font-black tracking-tight text-ink">
                  {report.scores.overall}
                </div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  Health score
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <ScoreRow label="Trust signals" value={report.scores.trust} />
              <ScoreRow label="Description" value={report.scores.descriptionQuality} />
              <ScoreRow label="Photo coverage" value={report.scores.photoCompleteness} />
              <ScoreRow label="Searchability" value={report.scores.searchability} />
            </div>
          </div>

          <ReportSection icon={CheckCircle2} title="How the score is calculated">
            <div className="space-y-2">
              {report.scoreBreakdown.map((item) => (
                <div key={item.id} className="rounded border border-line bg-raised p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">{item.label}</p>
                    <span className="text-xs font-black text-ink">
                      {item.earned}/{item.possible} pts
                    </span>
                  </div>
                  <Progress value={(item.earned / item.possible) * 100} />
                  <p className="mt-2 text-xs leading-5 text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </ReportSection>

          <ReportSection icon={TrendingUp} title="Top 5 fixes ranked by impact">
            <div className="space-y-2">
              {report.topFixes.length ? (
                report.topFixes.map((fix, index) => (
                  <div key={`${fix.title}-${index}`} className="rounded border border-line bg-raised p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{fix.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">{fix.detail}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge tone={fix.impact === "High" ? "danger" : fix.impact === "Medium" ? "warning" : "neutral"}>
                          {fix.impact}
                        </Badge>
                        <span className="text-xs font-black text-success">+{fix.scoreLift}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyLine text="No critical fixes found. Keep the proof visible." />
              )}
            </div>
          </ReportSection>

          <ReportSection icon={ShieldCheck} title="Missing trust signals">
            <BulletList items={report.missingTrustSignals} empty="Core trust signals are covered." />
          </ReportSection>

          <ReportSection icon={ImagePlus} title="Photo improvement checklist">
            <BulletList items={report.photoImprovements} empty="Photo coverage is complete." />
          </ReportSection>

          <ReportSection icon={Sparkles} title="Description quality feedback">
            <BulletList items={report.descriptionFeedback} empty="Description quality is strong." />
          </ReportSection>

          <ReportSection icon={SearchCheck} title="Searchability improvements">
            <BulletList items={report.searchabilityImprovements} empty="Search terms are in good shape." />
          </ReportSection>

          <ReportSection icon={AlertTriangle} title="Pricing feedback">
            <div className="rounded border border-line bg-raised p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={report.pricingFeedback.position === "within" ? "success" : "warning"}>
                  {report.pricingFeedback.position}
                </Badge>
                <span className="text-sm font-bold text-ink">
                  CHF {formatChf(report.pricingFeedback.benchmarkLow)} to CHF{" "}
                  {formatChf(report.pricingFeedback.benchmarkHigh)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{report.pricingFeedback.concern}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {report.pricingFeedback.originalNewPriceEstimate ? (
                  <PriceFact
                    label="Estimated new price"
                    value={`CHF ${formatChf(report.pricingFeedback.originalNewPriceEstimate)}`}
                  />
                ) : null}
                {report.pricingFeedback.adjustedBenchmarkPrice ? (
                  <PriceFact
                    label="Adjusted midpoint"
                    value={`CHF ${formatChf(report.pricingFeedback.adjustedBenchmarkPrice)}`}
                  />
                ) : null}
                {report.pricingFeedback.medianPrice ? (
                  <PriceFact
                    label="Median"
                    value={`CHF ${formatChf(report.pricingFeedback.medianPrice)}`}
                  />
                ) : null}
              </div>
              {report.pricingFeedback.valuationFactors?.length ? (
                <p className="mt-2 text-[11px] font-semibold text-muted">
                  Factors: {report.pricingFeedback.valuationFactors.join(", ")}.
                </p>
              ) : null}
              {report.pricingFeedback.sampleSize ? (
                <p className="mt-2 text-[11px] font-semibold text-muted">
                  Compared with {report.pricingFeedback.sampleSize} matched listings from{" "}
                  {report.pricingFeedback.benchmarkUniverseSize ?? "the"} historical records.
                </p>
              ) : null}
            </div>
          </ReportSection>

          <ReportSection icon={Gauge} title="Expected impact">
            <div className="space-y-3 rounded border border-line bg-raised p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">estimated</Badge>
                <Badge tone={report.predictiveInsights.confidence === "High" ? "success" : "warning"}>
                  {report.predictiveInsights.confidence} confidence
                </Badge>
                <span className="text-sm font-black text-ink">
                  {report.predictiveInsights.expectedLeadImpact} expected enquiry lift
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <PriceFact
                  label="Lead probability"
                  value={`${report.predictiveInsights.leadProbabilityScore}/100`}
                />
                <PriceFact
                  label="First contact"
                  value={report.predictiveInsights.expectedTimeToFirstContact}
                />
                <PriceFact
                  label="Days online"
                  value={`${report.predictiveInsights.expectedDaysToSell} days`}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                  Likely buyer objections
                </p>
                <BulletList
                  items={report.predictiveInsights.likelyBuyerObjections}
                  empty="No major objections predicted from the current evidence."
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                  Basis
                </p>
                <BulletList
                  items={report.predictiveInsights.performanceSignals.map(formatProductEvidenceSignal)}
                  empty=""
                />
              </div>
            </div>
          </ReportSection>

          <ReportSection icon={HelpCircle} title="Buyer questions this listing may trigger">
            <BulletList items={report.buyerQuestions} empty="Few obvious buyer objections remain." />
          </ReportSection>

          <ReportSection icon={CheckCircle2} title="Improved listing title">
            <p className="rounded border border-line bg-raised p-3 text-sm font-bold leading-6 text-ink">
              {report.improvedTitle}
            </p>
          </ReportSection>

          <ReportSection
            icon={Copy}
            title="Rewritten listing description"
            action={
              <Button
                type="button"
                size="sm"
                onClick={() => onCopy("description", report.rewrittenDescription)}
              >
                <Copy className="size-3.5" aria-hidden="true" />
                {copiedTarget === "description" ? "Copied" : "Copy"}
              </Button>
            }
          >
            <pre className="whitespace-pre-wrap rounded border border-line bg-raised p-3 text-xs leading-5 text-ink">
              {report.rewrittenDescription}
            </pre>
          </ReportSection>

          <ReportSection
            icon={Clipboard}
            title="Final pre-publish checklist"
            action={
              <Button type="button" size="sm" onClick={() => onCopy("checklist", checklistText)}>
                <Copy className="size-3.5" aria-hidden="true" />
                {copiedTarget === "checklist" ? "Copied" : "Copy"}
              </Button>
            }
          >
            <ol className="space-y-2">
              {report.finalPrePublishChecklist.map((item, index) => (
                <li key={item} className="flex gap-2 text-xs leading-5 text-muted">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-accent/25 text-[10px] font-black text-accent-ink">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </ReportSection>
        </div>
      </div>
    </aside>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? "success" : value >= 55 ? "warning" : "danger";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-muted">{label}</span>
        <span className="font-black text-ink">{value}</span>
      </div>
      <Progress value={value} tone={tone} />
    </div>
  );
}

function PriceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-panel px-2.5 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-xs font-black text-ink">{value}</p>
    </div>
  );
}

function ReportSection({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
          <span className="flex size-7 items-center justify-center rounded border border-line bg-raised">
            <Icon className="size-4 text-muted" aria-hidden="true" />
          </span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <EmptyLine text={empty} />;

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-xs leading-5 text-muted">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded border border-line bg-raised p-3 text-xs leading-5 text-muted">{text}</p>;
}

function formatProductEvidenceSignal(value: string) {
  return value
    .replace(/^Simulated from /, "Based on ")
    .replace(/successful synthetic comparable listings/g, "successful comparable listings")
    .replace(/High-quality synthetic comparables/g, "High-quality comparables")
    .replace(/Successful synthetic comparables/g, "Successful comparables")
    .replace(/synthetic comparable sample/g, "comparable sample")
    .replace(/synthetic comparables/g, "comparables")
    .replace(/synthetic comparable/g, "comparable")
    .replace(/matched local records/g, "matched records")
    .replace(/in the synthetic history/g, "in comparable history")
    .replace(/Sold comparables/g, "Sold comparable listings")
    .replace(/No sold comparables/g, "No sold comparable listings")
    .replace(/under the mocked benchmark model/g, "under the benchmark model");
}

function formatChf(value: number) {
  return new Intl.NumberFormat("de-CH").format(value);
}
