"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "secondary";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-none border transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2";

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-label",
  md: "h-10 px-4 text-label",
};

const variantStyles: Record<Variant, string> = {
  primary:
    "border-[var(--blue)] bg-[var(--blue-deep)] text-[var(--text)] " +
    "hover:border-[var(--blue-bright)] hover:bg-[var(--blue)] focus-visible:outline-[var(--blue-star)]",
  secondary:
    "border-[var(--border-subtle)] bg-[var(--abyss)] text-[var(--text)] " +
    "hover:border-[var(--border-active)] hover:bg-[var(--surface)] focus-visible:outline-[var(--blue-star)]",
  ghost:
    "border-transparent bg-transparent text-[var(--text-muted)] " +
    "hover:text-[var(--text)] hover:bg-[var(--surface)] focus-visible:outline-[var(--blue-star)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, sizeStyles[size], variantStyles[variant], className)}
      {...rest}
    />
  );
});
