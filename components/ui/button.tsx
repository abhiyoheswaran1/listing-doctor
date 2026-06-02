"use client";

import { Button as AutoScoutButton } from "@smg-automotive/components";
import type {
  ButtonHTMLAttributes,
  ComponentType,
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const OfficialButton = AutoScoutButton as unknown as ComponentType<{
  as?: "button";
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "success" | "transparent";
  size?: "md" | "lg";
  isDisabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  height?: string;
  minHeight?: string;
  px?: string;
  fontSize?: string;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "size">>;

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

const officialVariants: Record<ButtonVariant, "primary" | "secondary" | "transparent"> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "transparent",
  danger: "secondary",
};

const officialSizes: Record<ButtonSize, "md" | "lg"> = {
  sm: "md",
  md: "md",
};

const officialSizeProps: Record<ButtonSize, { height: string; minHeight: string; px: string; fontSize: string }> = {
  sm: { height: "2rem", minHeight: "2rem", px: "0.625rem", fontSize: "0.75rem" },
  md: { height: "2.25rem", minHeight: "2.25rem", px: "0.75rem", fontSize: "0.875rem" },
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
    <OfficialButton
      as="button"
      type={type}
      variant={officialVariants[variant]}
      size={officialSizes[size]}
      isDisabled={disabled}
      onClick={onClick}
      {...officialSizeProps[size]}
      className={cn(
        "inline-flex items-center justify-center rounded-[3px] border font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </OfficialButton>
  );
}
