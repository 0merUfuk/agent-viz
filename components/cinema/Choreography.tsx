"use client";

import { useEffect, useMemo, useState } from "react";
import { useEventStream } from "@/components/scenarios/eventStream";
import { findScenario, type TimelineEvent } from "@/components/scenarios/scripts";
import { cn } from "@/lib/cn";

/**
 * Scenario-start flash + completion banner. Full-screen one-shot
 * overlays that fire on transitions into and out of scenario play.
 */

export function Choreography({ reducedMotion }: { reducedMotion?: boolean }) {
  const { active, scenarioId, latestVerdict } = useEventStream();
  const [showStartFlash, setShowStartFlash] = useState(false);
  const [showBanner, setShowBanner] = useState<TimelineEvent | null>(null);
  const scenario = useMemo(
    () => (scenarioId ? findScenario(scenarioId) : null),
    [scenarioId],
  );

  // Fire start flash when `active` flips on.
  useEffect(() => {
    if (!active || reducedMotion) return;
    setShowStartFlash(true);
    const t = setTimeout(() => setShowStartFlash(false), 900);
    return () => clearTimeout(t);
  }, [active, reducedMotion]);

  // Show banner when a verdict lands.
  useEffect(() => {
    if (!latestVerdict) return;
    setShowBanner(latestVerdict);
    const t = setTimeout(() => setShowBanner(null), 3500);
    return () => clearTimeout(t);
  }, [latestVerdict]);

  return (
    <>
      {showStartFlash && scenario && (
        <div className="pointer-events-none fixed inset-0 z-40 choreo-start-flash">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="choreo-start-plate flex flex-col items-center gap-2 border border-[var(--gold-deep)] bg-[var(--void)]/95 backdrop-blur px-8 py-6">
              <span className="text-[10px] uppercase tracking-[0.32em] font-[var(--font-orbitron)] text-[var(--text-dim)]">
                ▸
              </span>
              <span className="text-title text-[var(--gold-bright)] text-center">
                {scenario.title}
              </span>
              <span className="text-body text-[var(--text-muted)]">
                {scenario.subtitle}
              </span>
            </div>
          </div>
        </div>
      )}

      {showBanner && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center">
          <div
            className={cn(
              "choreo-banner flex items-center gap-3 border-2 px-6 py-3 backdrop-blur",
              showBanner.verdict === "approved"
                ? "border-[var(--gold-bright)] bg-[rgba(232,201,112,0.08)]"
                : showBanner.verdict === "blocked"
                  ? "border-[var(--live)] bg-[rgba(247,99,108,0.08)]"
                  : "border-[var(--blue-bright)] bg-[rgba(96,165,250,0.08)]",
            )}
          >
            <span
              className={cn(
                "text-[10px] uppercase tracking-[0.32em] font-[var(--font-orbitron)]",
                showBanner.verdict === "approved"
                  ? "text-[var(--gold-bright)]"
                  : showBanner.verdict === "blocked"
                    ? "text-[var(--live)]"
                    : "text-[var(--blue-bright)]",
              )}
            >
              {showBanner.verdict === "approved"
                ? "Pipeline complete · approved"
                : showBanner.verdict === "blocked"
                  ? "Pipeline halted · blocked"
                  : "Pipeline resolved"}
            </span>
            <span className="text-body text-[var(--text)] font-[var(--font-orbitron)]">
              {showBanner.content}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
