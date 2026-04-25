"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, Square, Activity, Users, Cpu, Hash } from "lucide-react";
import { Header } from "@/components/shell/Header";
import { StatusBar, type StatusState } from "@/components/shell/StatusBar";
import { RepoLoader } from "@/components/input/RepoLoader";
import { Toast, type ToastTone } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { useCinemaSync } from "@/lib/cinema-sync";
import { SOURCE_LABEL } from "@/lib/constants";
import { probeBridge } from "@/lib/bridge-client";
import { SCENARIOS } from "@/components/scenarios/scripts";
import type { ScenarioId, Scenario } from "@/components/scenarios/scripts";
import { cn } from "@/lib/cn";
import type { Ecosystem } from "@/lib/types";

const SCENARIO_ACCENT: Record<ScenarioId, string> = {
  "s1-review":   "var(--blue-bright)",
  "s2-strategy": "var(--blue-star)",
  "s3-pipeline": "var(--gold-bright)",
};

export default function StagePage() {
  const [cinema, update] = useCinemaSync();
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [toast, setToast] = useState<{ tone: ToastTone; title: string; message?: string } | null>(null);
  const [status, setStatus] = useState<StatusState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4800);
    return () => clearTimeout(t);
  }, [toast]);

  // Bridge probe.
  useEffect(() => {
    let cancelled = false;
    const tick = () => probeBridge(500).then((ok) => {
      if (!cancelled) update((prev) => ({ ...prev, liveAvailable: ok }));
    });
    tick();
    const interval = setInterval(tick, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [update]);

  // Drive status.
  useEffect(() => {
    if (cinema.running) {
      setStatus("running");
      setStatusMessage("Pipeline in flight");
    } else if (cinema.ecosystem) {
      setStatus("ready");
      setStatusMessage(undefined);
    } else {
      setStatus("idle");
      setStatusMessage(undefined);
    }
  }, [cinema.running, cinema.ecosystem]);

  const handleEcosystemLoaded = useCallback(
    (eco: Ecosystem) => {
      update((prev) => ({ ...prev, ecosystem: eco, selectedId: null }));
      setLoaderOpen(false);
    },
    [update],
  );

  const runScenario = useCallback(
    (id: ScenarioId) => {
      update((prev) => ({
        ...prev,
        activeScenario: id,
        running: true,
        epoch: prev.epoch + 1,
      }));
    },
    [update],
  );

  const cancelScenario = useCallback(() => {
    update((prev) => ({ ...prev, running: false, activeScenario: null }));
  }, [update]);

  const loadSample = useCallback(async () => {
    setStatus("loading");
    setStatusMessage("Loading ecosystem");

    const loadFrom = async (url: string): Promise<Ecosystem> => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`${url} returned ${res.status}`);
      return res.json();
    };

    try {
      let data: Ecosystem;
      try {
        data = await loadFrom("/default-ecosystem.json");
      } catch (defaultErr) {
        console.warn("default-ecosystem.json unavailable, falling back:", defaultErr);
        data = await loadFrom("/sample-ecosystem.json");
      }
      update((prev) => ({ ...prev, ecosystem: data, selectedId: null }));
      setStatus("ready");
      setStatusMessage(undefined);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setStatusMessage("Ecosystem failed to load");
      setToast({ tone: "error", title: "Ecosystem failed to load" });
    }
  }, [update]);

  const activeScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === cinema.activeScenario) ?? null,
    [cinema.activeScenario],
  );

  return (
    <div className="flex h-dvh w-full flex-col bg-[var(--void)]">
      <Header
        mode={cinema.mode}
        liveAvailable={cinema.liveAvailable}
        onModeChange={(m) => update((prev) => ({ ...prev, mode: m }))}
        onOpenLoader={() => setLoaderOpen(true)}
        variant="stage"
      />

      <main className="relative flex flex-1 overflow-hidden">
        {/* Left column — pipeline launcher */}
        <section className="w-[440px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--abyss)] overflow-y-auto">
          <div className="px-6 py-5 border-b border-[var(--border-subtle)]">
            <h2 className="text-display text-[var(--text)]">Pipelines</h2>
            <p className="text-body text-[var(--text-muted)] mt-1">
              Launch an operational pipeline.
            </p>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {SCENARIOS.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                active={cinema.activeScenario === s.id}
                running={cinema.running && cinema.activeScenario === s.id}
                canRun={!!cinema.ecosystem}
                onRun={() => runScenario(s.id)}
                onCancel={cancelScenario}
              />
            ))}
          </div>

          {!cinema.ecosystem && (
            <div className="mx-4 mb-4 border border-dashed border-[var(--border-subtle)] bg-[var(--void)] p-4">
              <p className="text-display-sm text-[var(--blue-bright)] mb-2">No ecosystem loaded</p>
              <p className="text-body text-[var(--text-muted)] mb-3">
                Load a repo or the sample dataset to enable pipelines.
              </p>
              <button
                type="button"
                onClick={loadSample}
                className="h-9 px-4 border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-active)] transition-colors text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text)]"
              >
                Load sample
              </button>
            </div>
          )}
        </section>

        {/* Right column — live mirror + metrics */}
        <section className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div>
              <h2 className="text-display text-[var(--text)]">Live mirror</h2>
              <p className="text-body text-[var(--text-muted)] mt-1">
                Audience tab on <code className="text-mono-sm text-[var(--blue-bright)]">/</code> renders the same state.
              </p>
            </div>
            <Badge tone={cinema.running ? "gold" : "cyan"}>
              {cinema.running ? "Running" : cinema.ecosystem ? "Ready" : "Idle"}
            </Badge>
          </div>

          <div className="flex-1 relative overflow-hidden bg-[var(--void)] p-6">
            <div className="relative mx-auto max-w-3xl h-full">
              <CinemaPreview
                ecosystem={cinema.ecosystem}
                activeScenario={activeScenario}
              />
            </div>
          </div>

          {/* HUD metrics row */}
          <div className="h-32 border-t border-[var(--border-subtle)] bg-[var(--abyss)] px-6 py-4 flex items-center gap-6">
            <Metric icon={<Users size={14} />} label="Agents" value={cinema.ecosystem?.agents.length ?? 0} tone="cyan" />
            <Divider />
            <Metric icon={<Hash size={14} />} label="Skills" value={cinema.ecosystem?.skills.length ?? 0} tone="cyan" />
            <Divider />
            <Metric icon={<Cpu size={14} />} label="Rules" value={cinema.ecosystem?.rules.length ?? 0} tone="cyan" />
            <Divider />
            <Metric
              icon={<Activity size={14} />}
              label="Pipeline"
              value={activeScenario?.title ?? "—"}
              tone={cinema.running ? "gold" : "muted"}
              textual
            />
          </div>
        </section>
      </main>

      <StatusBar
        state={status}
        message={statusMessage}
        agentCount={cinema.ecosystem?.agents.length ?? 0}
        skillCount={cinema.ecosystem?.skills.length ?? 0}
        ruleCount={cinema.ecosystem?.rules.length ?? 0}
        sourceLabel={SOURCE_LABEL}
      />

      <RepoLoader
        open={loaderOpen}
        onClose={() => setLoaderOpen(false)}
        onLoaded={handleEcosystemLoaded}
        onLoadSample={loadSample}
      />

      <Toast
        open={!!toast}
        tone={toast?.tone}
        title={toast?.title ?? ""}
        message={toast?.message}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

interface ScenarioCardProps {
  scenario: Scenario;
  active: boolean;
  running: boolean;
  canRun: boolean;
  onRun: () => void;
  onCancel: () => void;
}

function ScenarioCard({
  scenario,
  active,
  running,
  canRun,
  onRun,
  onCancel,
}: ScenarioCardProps) {
  const accent = SCENARIO_ACCENT[scenario.id];
  const disabled = !canRun && !running;
  return (
    <button
      type="button"
      onClick={running ? onCancel : onRun}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-start gap-2 border bg-[var(--void)] p-4 text-left transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-[var(--gold)] bg-[rgba(232,201,112,0.04)]"
          : "border-[var(--border-subtle)] hover:border-[var(--border-active)]",
      )}
      style={{
        boxShadow: active ? `0 0 24px ${accent}33` : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center border"
          style={{
            borderColor: accent,
            background: active ? `${accent}22` : "transparent",
            color: accent,
          }}
        >
          {running ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
        </span>
        <div className="flex flex-col">
          <span className="text-[13px] font-[var(--font-orbitron)] uppercase tracking-[0.14em] text-[var(--text)]">
            {scenario.title}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] font-[var(--font-orbitron)] text-[var(--text-dim)]">
            {scenario.subtitle}
          </span>
        </div>
      </div>

      <p className="text-body text-[var(--text-muted)]">
        {scenario.steps.length} steps · {(scenario.steps.reduce((sum, s) => sum + s.durationMs, 0) / 1000).toFixed(1)}s
      </p>

      {active && (
        <div className="w-full mt-1 border-t border-[var(--border-subtle)] pt-2">
          <p className="text-[10px] uppercase tracking-[0.18em] font-[var(--font-orbitron)] text-[var(--text-dim)] mb-1">
            {running ? "Active" : "Queued"}
          </p>
          <ol className="flex flex-col gap-0.5">
            {scenario.steps.slice(0, 4).map((step, i) => (
              <li key={i} className="text-mono-sm text-[var(--text-muted)] truncate">
                <span className="text-[var(--text-dim)]">{String(i + 1).padStart(2, "0")}</span>{" "}
                {step.label ?? "(step)"}
              </li>
            ))}
            {scenario.steps.length > 4 && (
              <li className="text-mono-sm text-[var(--text-dim)]">…+{scenario.steps.length - 4} more</li>
            )}
          </ol>
        </div>
      )}
    </button>
  );
}

function CinemaPreview({
  ecosystem,
  activeScenario,
}: {
  ecosystem: Ecosystem | null;
  activeScenario: Scenario | null;
}) {
  if (!ecosystem) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-body text-[var(--text-dim)]">Load an ecosystem to preview</p>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-6">
        <Count label="Agents" value={ecosystem.agents.length} accent="var(--blue-bright)" />
        <Count label="Skills" value={ecosystem.skills.length} accent="var(--blue-star)" />
        <Count label="Rules" value={ecosystem.rules.length} accent="var(--gold-bright)" />
      </div>
      {activeScenario ? (
        <p className="text-display-sm text-[var(--gold-bright)] mt-4">
          ▶ {activeScenario.title}
        </p>
      ) : (
        <p className="text-body text-[var(--text-dim)] mt-4">Cinema idle — standing by</p>
      )}
      <p className="text-mono-sm text-[var(--text-dim)] mt-2 text-center max-w-sm">
        {SOURCE_LABEL}
      </p>
    </div>
  );
}

function Count({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-[64px] leading-none font-[var(--font-cinzel)] font-bold"
        style={{ color: accent }}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-[0.22em] font-[var(--font-orbitron)] text-[var(--text-dim)]">
        {label}
      </span>
    </div>
  );
}

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "gold" | "cyan" | "muted";
  textual?: boolean;
}

function Metric({ icon, label, value, tone, textual }: MetricProps) {
  const color =
    tone === "gold"
      ? "var(--gold-bright)"
      : tone === "cyan"
        ? "var(--blue-bright)"
        : "var(--text-dim)";
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-[var(--font-orbitron)] text-[var(--text-dim)]">
        <span style={{ color }}>{icon}</span>
        {label}
      </span>
      <span
        className={cn("font-[var(--font-orbitron)] truncate", textual ? "text-body" : "text-display")}
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <span className="h-10 w-px bg-[var(--border-subtle)]" aria-hidden />;
}
