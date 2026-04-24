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
import type { Ecosystem } from "@/lib/types";

const SCENARIOS: ScenarioDescriptor[] = [
  { id: "s1-review",   title: "Review a diff",   subtitle: "Reviewer", durationMs: 6000 },
  { id: "s2-strategy", title: "Strategy review", subtitle: "Monthly",  durationMs: 8000 },
  { id: "s3-pipeline", title: "Dev pipeline",    subtitle: "8 agents", durationMs: 16000 },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("demo");
  const [liveAvailable] = useState(false);
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [ecosystem, setEcosystem] = useState<Ecosystem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioId | null>(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<StatusState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);

  const graphState = useMemo<GraphState>(
    () => ({
      ecosystem,
      selectedId,
      activeNodeIds: new Set<string>(),
      activeEdgeIds: new Set<string>(),
      setSelected: setSelectedId,
    }),
    [ecosystem, selectedId],
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

        <main className="relative flex-1 overflow-hidden">
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

        {loaderOpen && (
          <LoaderPlaceholder
            onClose={() => setLoaderOpen(false)}
            onLoadSample={() => {
              setLoaderOpen(false);
              loadSample();
            }}
          />
        )}

        <DetailPanel
          ecosystem={ecosystem}
          selectedId={selectedId}
          onClose={() => setSelectedId(null)}
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

function LoaderPlaceholder({
  onClose,
  onLoadSample,
}: {
  onClose: () => void;
  onLoadSample: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-[var(--border-subtle)] bg-[var(--abyss)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-display-sm text-[var(--blue-bright)] mb-2">Load repo</p>
        <p className="text-body text-[var(--text-muted)] mb-4">
          GitHub URL loader ships in Phase 6. For now, explore the sample ecosystem.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onLoadSample}
            className="h-10 px-5 border border-[var(--blue)] bg-[var(--blue-deep)] hover:bg-[var(--blue)] hover:border-[var(--blue-bright)] transition-colors text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text)]"
          >
            Load sample
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-[var(--border-subtle)] bg-transparent text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
