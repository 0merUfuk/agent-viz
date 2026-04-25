/**
 * Canvas backdrop — minimal flat dark surface.
 *
 * The theatrical parallax layers (nebulae, starfield, orbital rings, circuit
 * drift, shooting stars, scenic code fragments) were removed as part of the
 * de-demo motion strip. The backdrop is now a plain dark div; the base page
 * already paints `--void`, but we keep an explicit backdrop element so callers
 * (e.g., EcosystemGraph) continue to render a reserved layer without layout
 * impact.
 *
 * No `"use client"` directive — this is a pure static JSX render with no
 * hooks, browser APIs, or handlers. The client boundary is set upstream by
 * EcosystemGraph, which already opts into the client bundle.
 */
export function CanvasBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-[var(--void)]"
      aria-hidden
    />
  );
}
