"use client";

import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";
import { useEventStream } from "@/components/scenarios/eventStream";
import { useGraph } from "@/components/graph/EcosystemContext";
import { Typewriter } from "./Typewriter";
import type { TimelineEvent } from "@/components/scenarios/scripts";
import { cn } from "@/lib/cn";

/**
 * Bottom strip that renders handoff + verdict events as agent-to-agent
 * cards flowing from right → left. Last 6 events remain visible; older
 * entries fade off the left edge.
 */

const MAX_VISIBLE = 6;

export function HandoffStrip({ reducedMotion }: { reducedMotion?: boolean }) {
  const { events, active } = useEventStream();
  const { ecosystem } = useGraph();

  const handoffs = useMemo(
    () => events.filter((e) => e.kind === "handoff" || e.kind === "verdict"),
    [events],
  );

  const visible = handoffs.slice(-MAX_VISIBLE);
  if (!active && handoffs.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-0 right-0 bottom-8 z-30",
        "flex items-end justify-end gap-3 px-6 pb-2",
      )}
      aria-live="polite"
    >
      {visible.map((evt, i) => {
        const age = visible.length - 1 - i;
        const opacity = Math.max(0.25, 1 - age * 0.15);
        const scale = 1 - age * 0.03;
        const fromAgent = ecosystem?.agents.find((a) => a.id === evt.from);
        const toAgent = ecosystem?.agents.find((a) => a.id === evt.to);
        return (
          <HandoffCard
            key={`${evt.at}-${evt.from}-${evt.to}-${i}`}
            event={evt}
            fromLabel={fromAgent?.name ?? evt.from ?? ""}
            toLabel={toAgent?.name ?? evt.to ?? ""}
            opacity={opacity}
            scale={scale}
            instant={reducedMotion || age > 0}
          />
        );
      })}
    </div>
  );
}

interface HandoffCardProps {
  event: TimelineEvent;
  fromLabel: string;
  toLabel: string;
  opacity: number;
  scale: number;
  instant: boolean;
}

function HandoffCard({
  event,
  fromLabel,
  toLabel,
  opacity,
  scale,
  instant,
}: HandoffCardProps) {
  const verdict = event.kind === "verdict";
  const approved = event.verdict === "approved";
  const blocked = event.verdict === "blocked";
  const accentColor = verdict
    ? approved
      ? "var(--gold-bright)"
      : blocked
        ? "var(--live)"
        : "var(--blue-bright)"
    : "var(--blue-bright)";

  return (
    <div
      className="handoff-card relative flex items-center gap-2 border bg-[var(--abyss)]/95 backdrop-blur px-3 py-2 min-w-[280px] max-w-[420px]"
      style={{
        borderColor: accentColor,
        boxShadow: `0 0 20px ${accentColor}22`,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "right center",
        pointerEvents: "auto",
      }}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <AgentAvatar label={fromLabel} />
        {verdict ? (
          approved ? (
            <CheckCircle2 size={14} style={{ color: accentColor }} />
          ) : blocked ? (
            <XCircle size={14} style={{ color: accentColor }} />
          ) : (
            <ArrowRight size={14} style={{ color: accentColor }} />
          )
        ) : (
          <ArrowRight size={14} style={{ color: accentColor }} />
        )}
        <AgentAvatar label={toLabel} accent={verdict} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] uppercase tracking-[0.22em] font-[var(--font-orbitron)] text-[var(--text-dim)] leading-tight">
          {verdict ? (approved ? "approved" : blocked ? "blocked" : "complete") : "→"}
        </p>
        <p className="text-body text-[var(--text)] leading-snug line-clamp-2">
          <Typewriter text={event.content} instant={instant} charsPerSec={50} />
        </p>
      </div>
    </div>
  );
}

function AgentAvatar({ label, accent }: { label: string; accent?: boolean }) {
  const letter = label?.[0]?.toUpperCase() ?? "?";
  return (
    <span
      className={cn(
        "flex h-6 w-6 items-center justify-center border text-mono-sm font-bold",
        accent
          ? "border-[var(--gold-bright)] text-[var(--gold-bright)] bg-[rgba(232,201,112,0.08)]"
          : "border-[var(--blue-deep)] text-[var(--blue-bright)] bg-[var(--void)]",
      )}
      title={label}
    >
      {letter}
    </span>
  );
}
