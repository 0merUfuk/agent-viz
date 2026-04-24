"use client";

import { useEffect, useMemo, useState } from "react";
import { Cpu, Wrench, Users, Timer } from "lucide-react";
import { useEventStream } from "@/components/scenarios/eventStream";
import type { TimelineEvent } from "@/components/scenarios/scripts";
import { cn } from "@/lib/cn";

/**
 * Top-right HUD showing live-looking scenario telemetry:
 *   tokens    — synthesized from event count × per-kind weights
 *   tools     — count of `tool` events
 *   agents    — distinct agents seen so far
 *   elapsed   — wall clock since scenario start
 *
 * Hidden when no scenario is active.
 */

const TOKEN_WEIGHTS: Record<TimelineEvent["kind"], number> = {
  handoff: 180,
  tool:    340,
  message: 95,
  verdict: 120,
};

export function CinemaHUD() {
  const { events, active, startedAt } = useEventStream();
  const [, setTick] = useState(0);

  // Tick every 100ms while active so `elapsed` rolls live.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((n) => (n + 1) % 100000), 100);
    return () => clearInterval(id);
  }, [active]);

  const stats = useMemo(() => {
    let tokens = 0;
    let tools = 0;
    const agentSet = new Set<string>();
    for (const e of events) {
      tokens += TOKEN_WEIGHTS[e.kind] ?? 50;
      if (e.kind === "tool") tools += 1;
      if (e.from) agentSet.add(e.from);
      if (e.to) agentSet.add(e.to);
    }
    return { tokens, tools, agents: agentSet.size };
  }, [events]);

  const elapsedMs = startedAt ? performance.now() - startedAt : 0;

  if (!active && events.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute top-4 right-[396px] z-30 flex flex-col gap-2 items-end"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex items-center gap-4 border border-[var(--border-subtle)] bg-[var(--abyss)]/80 backdrop-blur px-4 py-2",
          active && "hud-running",
        )}
      >
        <HUDMetric icon={<Cpu size={12} />}   label="Tokens"  value={stats.tokens.toLocaleString()} tone="cyan" mono />
        <Divider />
        <HUDMetric icon={<Wrench size={12} />} label="Tools"   value={stats.tools.toString()}        tone="gold" mono />
        <Divider />
        <HUDMetric icon={<Users size={12} />} label="Agents"   value={stats.agents.toString()}        tone="cyan" mono />
        <Divider />
        <HUDMetric icon={<Timer size={12} />} label="Elapsed"  value={formatElapsed(elapsedMs)}       tone="muted" mono />
      </div>
    </div>
  );
}

interface HUDMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "gold" | "cyan" | "muted";
  mono?: boolean;
}

function HUDMetric({ icon, label, value, tone, mono }: HUDMetricProps) {
  const color =
    tone === "gold"
      ? "var(--gold-bright)"
      : tone === "cyan"
        ? "var(--blue-bright)"
        : "var(--text-dim)";
  return (
    <div className="flex flex-col items-start gap-0.5 min-w-[58px]">
      <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.22em] font-[var(--font-orbitron)] text-[var(--text-dim)]">
        <span style={{ color }}>{icon}</span>
        {label}
      </span>
      <span
        className={cn("text-[15px] leading-none font-semibold tabular-nums", mono && "font-[var(--font-mono)]")}
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <span className="h-8 w-px bg-[var(--border-subtle)]" aria-hidden />;
}

function formatElapsed(ms: number): string {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
