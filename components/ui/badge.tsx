import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-panel text-muted",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/15 text-accent-ink",
  danger: "border-danger/30 bg-danger/10 text-danger",
  accent: "border-accent/60 bg-accent/25 text-accent-ink",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.035em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
