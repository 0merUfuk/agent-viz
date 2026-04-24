"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "gold" | "cyan" | "muted" | "success" | "live";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

const toneStyles: Record<Tone, string> = {
  gold:
    "border-[var(--gold-deep)] text-[var(--gold-bright)] bg-[rgba(232,201,112,0.06)]",
  cyan:
    "border-[var(--blue-deep)] text-[var(--blue-bright)] bg-[rgba(96,165,250,0.06)]",
  muted:
    "border-[var(--border-subtle)] text-[var(--text-muted)] bg-transparent",
  success:
    "border-[var(--success)] text-[var(--success)] bg-[rgba(74,222,128,0.08)]",
  live:
    "border-[var(--live)] text-[var(--live)] bg-[rgba(244,114,182,0.08)]",
};

export function Badge({ tone = "cyan", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 border px-1.5 text-[10px]",
        "uppercase tracking-[0.14em] leading-none",
        "font-[var(--font-orbitron)]",
        toneStyles[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
