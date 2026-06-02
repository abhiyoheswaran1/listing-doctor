import { cn } from "@/lib/utils";

export function Progress({
  value,
  tone = "accent",
  className,
}: {
  value: number;
  tone?: "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const bounded = Math.max(0, Math.min(100, value));
  const color =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "danger"
          ? "bg-danger"
          : "bg-accent";

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-line", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${bounded}%` }}
      />
    </div>
  );
}
