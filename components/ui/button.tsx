"use client";

import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
} from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-accent-ink hover:brightness-95 active:translate-y-px",
  secondary:
    "border-line bg-panel text-ink hover:border-muted hover:bg-raised active:translate-y-px",
  ghost: "border-transparent bg-transparent text-ink shadow-none hover:bg-raised active:translate-y-px",
  danger:
    "border-danger/40 bg-danger/10 text-danger hover:bg-danger/15 active:translate-y-px",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-9 gap-2 px-3 text-sm",
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  children,
  disabled,
  type = "button",
  onClick,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-[3px] border font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
