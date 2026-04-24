"use client";

import { useState } from "react";
import { Header, type Mode } from "@/components/shell/Header";
import {
  ScenarioBar,
  type ScenarioDescriptor,
  type ScenarioId,
} from "@/components/shell/ScenarioBar";
import { StatusBar } from "@/components/shell/StatusBar";

const SCENARIOS: ScenarioDescriptor[] = [
  { id: "s1-review",   title: "Review a diff",       subtitle: "Reviewer",     durationMs: 6000 },
  { id: "s2-strategy", title: "Strategy review",     subtitle: "Monthly",      durationMs: 8000 },
  { id: "s3-pipeline", title: "Dev pipeline",        subtitle: "8 agents",     durationMs: 16000 },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("demo");
  const [liveAvailable] = useState(false);
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioId | null>(null);
  const [running, setRunning] = useState(false);

  // Phase 1 shell only — graph loads in Phase 3, scenarios wire in Phase 5.
  const ecosystemLoaded = false;

  return (
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
        canRun={ecosystemLoaded}
        onRun={(id) => {
          setActiveScenario(id);
          setRunning(true);
        }}
        onCancel={() => {
          setRunning(false);
          setActiveScenario(null);
        }}
      />

      {/* Canvas placeholder — Phase 3 replaces with EcosystemGraph */}
      <main className="relative flex-1 overflow-hidden">
        <EmptyCanvas onLoad={() => setLoaderOpen(true)} />
      </main>

      <StatusBar
        state={ecosystemLoaded ? "ready" : "idle"}
        agentCount={0}
        skillCount={0}
        ruleCount={0}
        mode={mode}
      />

      {loaderOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLoaderOpen(false)}
        >
          <div
            className="w-full max-w-md border border-[var(--border-subtle)] bg-[var(--abyss)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-display-sm text-[var(--blue-bright)] mb-2">Load repo</p>
            <p className="text-body text-[var(--text-muted)]">
              GitHub URL loader ships in Phase 6. Placeholder for now.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyCanvas({ onLoad }: { onLoad: () => void }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Radial rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[520, 380, 260].map((size) => (
          <div
            key={size}
            className="absolute rounded-full border border-[var(--blue-deep)]/30 radial-pulse"
            style={{ width: size, height: size, animationDelay: `${size * -3}ms` }}
          />
        ))}
      </div>

      <div className="relative z-10 flex max-w-xl flex-col items-center gap-6 text-center px-6">
        <p className="text-display-sm text-[var(--blue-bright)]">Empty canvas</p>
        <h1 className="text-hero gold-gradient">observe the ecosystem</h1>
        <p className="text-body text-[var(--text-muted)] max-w-md">
          Paste any public GitHub repo containing a <code className="text-mono-sm text-[var(--blue-bright)]">.claude/</code> directory,
          or explore a fabricated sample to see the graph in motion.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onLoad}
            className="h-10 px-5 border border-[var(--blue)] bg-[var(--blue-deep)] hover:bg-[var(--blue)] hover:border-[var(--blue-bright)] transition-colors text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text)]"
          >
            Load repo
          </button>
          <button
            type="button"
            disabled
            className="h-10 px-5 border border-[var(--border-subtle)] bg-transparent opacity-40 cursor-not-allowed text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text-muted)]"
          >
            Load sample
          </button>
        </div>
      </div>
    </div>
  );
}
