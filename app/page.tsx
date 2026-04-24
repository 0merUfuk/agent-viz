"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shell/Header";
import { StatusBar, type StatusState } from "@/components/shell/StatusBar";
import { EcosystemGraph } from "@/components/graph/EcosystemGraph";
import {
  GraphProvider,
  type GraphState,
} from "@/components/graph/EcosystemContext";
import { DetailPanel } from "@/components/panel/DetailPanel";
import { useScenarioPlayer } from "@/components/scenarios/ScenarioPlayer";
import { useLivePlayer } from "@/components/scenarios/LivePlayer";
import { useCinemaSync } from "@/lib/cinema-sync";
import type { Ecosystem } from "@/lib/types";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return reduced;
}

/**
 * Audience cinema view. No controls visible. Listens for state from /stage
 * via BroadcastChannel. Triple-tap `p` escape hatch navigates to /stage.
 */
export default function Home() {
  const router = useRouter();
  const [cinema, update] = useCinemaSync();
  const [status, setStatus] = useState<StatusState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);
  const reducedMotion = usePrefersReducedMotion();

  const handleComplete = useCallback(() => {
    setStatus("complete");
    setStatusMessage("Scenario complete");
    update((prev) => ({ ...prev, running: false }));
    setTimeout(() => {
      setStatusMessage(undefined);
      setStatus("ready");
      update((prev) => ({ ...prev, activeScenario: null }));
    }, 1800);
  }, [update]);

  const handleStall = useCallback(() => {
    setStatus("error");
    setStatusMessage("Live session stalled");
    update((prev) => ({ ...prev, running: false, activeScenario: null, mode: "demo" }));
    setTimeout(() => {
      setStatus("ready");
      setStatusMessage(undefined);
    }, 3200);
  }, [update]);

  const scenarioState = useScenarioPlayer({
    scenarioId: cinema.mode === "demo" ? cinema.activeScenario : null,
    running: cinema.mode === "demo" && cinema.running,
    onComplete: handleComplete,
    reducedMotion,
  });

  const liveState = useLivePlayer({
    scenarioId: cinema.mode === "live" ? cinema.activeScenario : null,
    running: cinema.mode === "live" && cinema.running,
    ecosystem: cinema.ecosystem,
    onComplete: handleComplete,
    onStall: handleStall,
  });

  const activeNodeIds = cinema.mode === "live" ? liveState.activeNodeIds : scenarioState.activeNodeIds;
  const activeEdgeIds = cinema.mode === "live" ? liveState.activeEdgeIds : scenarioState.activeEdgeIds;
  const currentLabel = cinema.mode === "live" ? liveState.currentLabel : scenarioState.currentLabel;

  // Drive status bar from scenario progress.
  useEffect(() => {
    if (!cinema.running) {
      if (cinema.ecosystem && status === "idle") setStatus("ready");
      return;
    }
    setStatus("running");
    setStatusMessage(currentLabel ?? "Running");
  }, [cinema.running, cinema.ecosystem, currentLabel, status]);

  // Auto-load sample if nothing loaded yet (audience never sees blank canvas).
  useEffect(() => {
    if (cinema.ecosystem) return;
    let cancelled = false;
    setStatus("loading");
    setStatusMessage("Loading sample");
    fetch("/sample-ecosystem.json", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: Ecosystem) => {
        if (cancelled) return;
        update((prev) => ({ ...prev, ecosystem: data }));
        setStatus("ready");
        setStatusMessage(undefined);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setStatus("error");
        setStatusMessage("Sample failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [cinema.ecosystem, update]);

  const setSelectedId = useCallback(
    (id: string | null) => update((prev) => ({ ...prev, selectedId: id })),
    [update],
  );

  const graphState = useMemo<GraphState>(
    () => ({
      ecosystem: cinema.ecosystem,
      selectedId: cinema.selectedId,
      activeNodeIds,
      activeEdgeIds,
      setSelected: setSelectedId,
    }),
    [cinema.ecosystem, cinema.selectedId, activeNodeIds, activeEdgeIds, setSelectedId],
  );

  // Triple-tap `p` escape hatch → navigate to /stage.
  useEffect(() => {
    const taps: number[] = [];
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key !== "p" && e.key !== "P") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const now = performance.now();
      const filtered = taps.filter((t) => now - t < 600);
      filtered.push(now);
      taps.length = 0;
      taps.push(...filtered);
      if (taps.length >= 3) {
        taps.length = 0;
        router.push("/stage");
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onEscape);
    };
  }, [router, setSelectedId]);

  return (
    <GraphProvider value={graphState}>
      <div className="flex h-dvh w-full flex-col bg-[var(--void)]">
        <a href="#canvas" className="skip-link">Skip to canvas</a>
        <Header
          mode={cinema.mode}
          liveAvailable={cinema.liveAvailable}
          onModeChange={() => {}}
          onOpenLoader={() => {}}
          variant="cinema"
        />

        <main id="canvas" className="relative flex-1 overflow-hidden" aria-label="Ecosystem graph">
          {cinema.ecosystem ? (
            <EcosystemGraph ecosystem={cinema.ecosystem} />
          ) : (
            <InitializingCanvas loading={status === "loading"} />
          )}
        </main>

        <StatusBar
          state={status}
          message={statusMessage}
          agentCount={cinema.ecosystem?.agents.length ?? 0}
          skillCount={cinema.ecosystem?.skills.length ?? 0}
          ruleCount={cinema.ecosystem?.rules.length ?? 0}
          sourceLabel={cinema.ecosystem?.meta.sourceLabel}
          mode={cinema.mode}
          presenter={false}
        />

        <DetailPanel
          ecosystem={cinema.ecosystem}
          selectedId={cinema.selectedId}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </GraphProvider>
  );
}

function InitializingCanvas({ loading }: { loading: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[520, 380, 260].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border border-[var(--blue-deep)]/30 radial-pulse"
            style={{ width: size, height: size, animationDelay: `${i * -2000}ms` }}
          />
        ))}
      </div>
      <div className="relative z-10 flex max-w-xl flex-col items-center gap-6 text-center px-6">
        <p className="text-display-sm text-[var(--blue-bright)]">
          {loading ? "Initializing" : "Standing by"}
        </p>
        <h1 className="text-hero gold-gradient">observe the ecosystem</h1>
        <p className="text-body text-[var(--text-muted)] max-w-md">
          The system is warming up.
        </p>
      </div>
    </div>
  );
}
