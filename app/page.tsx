"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Header, type Mode } from "@/components/shell/Header";
import {
  ScenarioBar,
  type ScenarioDescriptor,
  type ScenarioId,
} from "@/components/shell/ScenarioBar";
import { StatusBar, type StatusState } from "@/components/shell/StatusBar";
import { EcosystemGraph } from "@/components/graph/EcosystemGraph";
import {
  GraphProvider,
  type GraphState,
} from "@/components/graph/EcosystemContext";
import { DetailPanel } from "@/components/panel/DetailPanel";
import { useScenarioPlayer } from "@/components/scenarios/ScenarioPlayer";
import { useLivePlayer } from "@/components/scenarios/LivePlayer";
import { RepoLoader } from "@/components/input/RepoLoader";
import { Toast, type ToastTone } from "@/components/ui/Toast";
import { probeBridge } from "@/lib/bridge-client";
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

const SCENARIOS: ScenarioDescriptor[] = [
  { id: "s1-review",   title: "Review a diff",   subtitle: "Reviewer", durationMs: 6000 },
  { id: "s2-strategy", title: "Strategy review", subtitle: "Monthly",  durationMs: 8000 },
  { id: "s3-pipeline", title: "Dev pipeline",    subtitle: "8 agents", durationMs: 16000 },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("demo");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [ecosystem, setEcosystem] = useState<Ecosystem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioId | null>(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<StatusState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<{ tone: ToastTone; title: string; message?: string } | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4800);
    return () => clearTimeout(t);
  }, [toast]);

  const handleComplete = useCallback(() => {
    setStatus("complete");
    setStatusMessage("Scenario complete");
    setRunning(false);
    setTimeout(() => {
      setStatusMessage(undefined);
      setStatus("ready");
      setActiveScenario(null);
    }, 1800);
  }, []);

  const handleStall = useCallback(() => {
    setStatus("error");
    setStatusMessage("Live session stalled — switching to demo");
    setRunning(false);
    setActiveScenario(null);
    setMode("demo");
    setToast({
      tone: "error",
      title: "Live session stalled",
      message: "No events received from the bridge for 30 seconds. Falling back to demo mode.",
    });
    setTimeout(() => {
      setStatus("ready");
      setStatusMessage(undefined);
    }, 3200);
  }, []);

  const scenarioState = useScenarioPlayer({
    scenarioId: mode === "demo" ? activeScenario : null,
    running: mode === "demo" && running,
    onComplete: handleComplete,
    reducedMotion,
  });

  const liveState = useLivePlayer({
    scenarioId: mode === "live" ? activeScenario : null,
    running: mode === "live" && running,
    ecosystem,
    onComplete: handleComplete,
    onStall: handleStall,
  });

  const activeNodeIds = mode === "live" ? liveState.activeNodeIds : scenarioState.activeNodeIds;
  const activeEdgeIds = mode === "live" ? liveState.activeEdgeIds : scenarioState.activeEdgeIds;
  const currentLabel = mode === "live" ? liveState.currentLabel : scenarioState.currentLabel;

  // Probe bridge on mount and when mode is toggled to live
  useEffect(() => {
    let cancelled = false;
    probeBridge(500).then((ok) => {
      if (!cancelled) setLiveAvailable(ok);
    });
    const interval = setInterval(() => {
      probeBridge(500).then((ok) => {
        if (!cancelled) setLiveAvailable(ok);
      });
    }, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // If live becomes unavailable mid-run, fall back to demo
  useEffect(() => {
    if (mode === "live" && !liveAvailable) {
      setMode("demo");
      setToast({
        tone: "error",
        title: "Bridge disconnected",
        message: "Reverted to demo mode. Re-run scripts/demo-up.sh to restart the daemon.",
      });
    }
  }, [mode, liveAvailable]);

  // Drive status bar from scenario progress.
  useEffect(() => {
    if (!running) return;
    setStatus("running");
    setStatusMessage(currentLabel ?? "Running");
  }, [running, currentLabel]);

  const graphState = useMemo<GraphState>(
    () => ({
      ecosystem,
      selectedId,
      activeNodeIds,
      activeEdgeIds,
      setSelected: setSelectedId,
    }),
    [ecosystem, selectedId, activeNodeIds, activeEdgeIds],
  );

  const loadSample = useCallback(async () => {
    setStatus("loading");
    setStatusMessage("Loading sample");
    try {
      const res = await fetch("/sample-ecosystem.json", { cache: "no-store" });
      const data: Ecosystem = await res.json();
      setEcosystem(data);
      setStatus("ready");
      setStatusMessage(undefined);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setStatusMessage("Sample failed to load");
      setToast({
        tone: "error",
        title: "Sample failed to load",
        message: "Check the dev console and confirm /sample-ecosystem.json is reachable.",
      });
    }
  }, []);

  // Keyboard shortcuts: S load sample, / focus (placeholder)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        loadSample();
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loadSample]);

  return (
    <GraphProvider value={graphState}>
      <div className="flex h-dvh w-full flex-col bg-[var(--void)]">
        <a href="#canvas" className="skip-link">Skip to canvas</a>
        <Header
          mode={mode}
          liveAvailable={liveAvailable}
          onModeChange={setMode}
          onOpenLoader={() => setLoaderOpen(true)}
        />

        <ScenarioBar
          scenarios={SCENARIOS}
          activeId={activeScenario}
          running={running}
          canRun={!!ecosystem}
          onRun={(id) => {
            setActiveScenario(id);
            setRunning(true);
          }}
          onCancel={() => {
            setRunning(false);
            setActiveScenario(null);
          }}
        />

        <main id="canvas" className="relative flex-1 overflow-hidden" aria-label="Ecosystem graph">
          {ecosystem ? (
            <EcosystemGraph ecosystem={ecosystem} />
          ) : (
            <EmptyCanvas
              onLoadRepo={() => setLoaderOpen(true)}
              onLoadSample={loadSample}
              loading={status === "loading"}
            />
          )}
        </main>

        <StatusBar
          state={status}
          message={statusMessage}
          agentCount={ecosystem?.agents.length ?? 0}
          skillCount={ecosystem?.skills.length ?? 0}
          ruleCount={ecosystem?.rules.length ?? 0}
          sourceLabel={ecosystem?.meta.sourceLabel}
          mode={mode}
        />

        <RepoLoader
          open={loaderOpen}
          onClose={() => setLoaderOpen(false)}
          onLoaded={(eco) => {
            setEcosystem(eco);
            setLoaderOpen(false);
            setStatus("ready");
            setStatusMessage(undefined);
          }}
          onLoadSample={loadSample}
        />

        <DetailPanel
          ecosystem={ecosystem}
          selectedId={selectedId}
          onClose={() => setSelectedId(null)}
        />

        <Toast
          open={!!toast}
          tone={toast?.tone}
          title={toast?.title ?? ""}
          message={toast?.message}
          onDismiss={() => setToast(null)}
        />
      </div>
    </GraphProvider>
  );
}

interface EmptyCanvasProps {
  onLoadRepo: () => void;
  onLoadSample: () => void;
  loading: boolean;
}

function EmptyCanvas({ onLoadRepo, onLoadSample, loading }: EmptyCanvasProps) {
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
        <p className="text-display-sm text-[var(--blue-bright)]">Empty canvas</p>
        <h1 className="text-hero gold-gradient">observe the ecosystem</h1>
        <p className="text-body text-[var(--text-muted)] max-w-md">
          Paste any public GitHub repo containing a{" "}
          <code className="text-mono-sm text-[var(--blue-bright)]">.claude/</code> directory,
          or explore a fabricated sample to see the graph in motion.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onLoadRepo}
            className="h-10 px-5 border border-[var(--blue)] bg-[var(--blue-deep)] hover:bg-[var(--blue)] hover:border-[var(--blue-bright)] transition-colors text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text)]"
          >
            Load repo
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            disabled={loading}
            className="h-10 px-5 border border-[var(--border-subtle)] bg-[var(--abyss)] hover:border-[var(--border-active)] hover:bg-[var(--surface)] disabled:opacity-40 transition-colors text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text)]"
          >
            {loading ? "Loading…" : "Load sample"}
          </button>
        </div>
        <p className="text-label text-[var(--text-dim)] mt-2">
          Tip: press <kbd className="text-mono-sm text-[var(--blue-bright)]">S</kbd> to load the sample.
        </p>
      </div>
    </div>
  );
}

