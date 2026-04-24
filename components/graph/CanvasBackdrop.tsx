"use client";

/**
 * Canvas backdrop — minimal flat dark surface.
 *
 * The theatrical parallax layers (nebulae, starfield, orbital rings, circuit
 * drift, shooting stars, scenic code fragments) were removed as part of the
 * de-demo motion strip. The backdrop is now a plain dark div; the base page
 * already paints `--void`, but we keep an explicit backdrop element so callers
 * (e.g., EcosystemGraph) continue to render a reserved layer without layout
 * impact.
 */
export function CanvasBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-[var(--void)]"
      aria-hidden
    />
  );
}
