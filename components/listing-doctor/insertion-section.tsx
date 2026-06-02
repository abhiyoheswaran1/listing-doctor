"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function InsertionSection({
  title,
  eyebrow,
  actions,
  children,
  defaultOpen = true,
  doctorSection,
}: PropsWithChildren<{
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  defaultOpen?: boolean;
  doctorSection?: string;
}>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className="overflow-hidden rounded-panel border border-line bg-panel shadow-panel"
      data-doctor-section={doctorSection}
      id={doctorSection ? `section-${doctorSection}` : undefined}
    >
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[3px] border border-line bg-raised text-muted">
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 text-muted transition-transform",
                open ? "rotate-0" : "-rotate-90",
              )}
            />
          </span>
          <span className="min-w-0">
            {eyebrow ? (
              <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                {eyebrow}
              </span>
            ) : null}
            <span className="block truncate text-lg font-black leading-tight text-ink">{title}</span>
          </span>
        </button>
        {actions}
      </div>
      {open ? <div className="border-t border-line/40 px-4 py-4">{children}</div> : null}
    </section>
  );
}
