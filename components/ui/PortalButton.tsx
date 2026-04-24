"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * PortalButton — the gold-accented gateway CTA defined in DESIGN.md §15.
 * Reserved for the primary "open a gateway" action on a surface (Load repo).
 * Only one instance should be visible at a time.
 *
 * States:
 *   idle     — breathing gold border + faint outer glow
 *   hover    — expanding flare ring, brightened fill, gold label shadow
 *   loading  — border rotates as a dashed stroke, label swaps to INITIALIZING…
 *   disabled — breath paused, 40% opacity
 */

export interface PortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  /** Visual emphasis — "primary" is gold gateway; "secondary" is still gold but toned down */
  emphasis?: "primary" | "secondary";
}

export const PortalButton = forwardRef<HTMLButtonElement, PortalButtonProps>(
  function PortalButton(
    {
      className,
      children,
      icon,
      loading,
      loadingLabel = "Initializing…",
      emphasis = "primary",
      type = "button",
      disabled,
      ...rest
    },
    ref,
  ) {
    const isPrimary = emphasis === "primary";
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "portal-btn relative inline-flex h-10 items-center gap-2 px-5",
          "border text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)]",
          "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-star)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          isPrimary ? "portal-btn--primary" : "portal-btn--secondary",
          loading && "portal-btn--loading",
          className,
        )}
        {...rest}
      >
        {/* Flare ring — pure CSS, triggers on hover via the class selector */}
        <span className="portal-btn__flare" aria-hidden />

        {/* Icon + label live above the flare */}
        <span className="relative z-10 flex items-center gap-2">
          {icon && <span className="portal-btn__icon flex items-center">{icon}</span>}
          <span className="portal-btn__label">
            {loading ? loadingLabel : children}
          </span>
        </span>
      </button>
    );
  },
);
