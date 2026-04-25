"use client";

import { useEffect, useMemo, useRef } from "react";
import { Users } from "lucide-react";
import { useEventStream } from "@/components/scenarios/eventStream";
import { useGraph } from "@/components/graph/EcosystemContext";
import { Typewriter } from "./Typewriter";
import type { TimelineEvent } from "@/components/scenarios/scripts";
import { cn } from "@/lib/cn";

/**
 * Left-side agent dialogue overlay. Renders every handoff and verdict
 * event as a monospace log line with the full sender → receiver names
 * and the brief that accompanied the handoff. Intentionally mirrors
 * `ToolCallStream`'s visual language so the two sidebars read as a
 * paired set: agent-to-agent dialogue on the left, tool/internal
 * activity on the right.
 *
 * Replaces the older bottom HandoffStrip, which used single-letter
 * avatars (M → R) that were unreadable beyond the front row.
 */

export function AgentCallStream({ reducedMotion }: { reducedMotion?: boolean }) {
  const { events, active, startedAt } = useEventStream();
  const { ecosystem } = useGraph();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Map of agent id → human-readable display name (e.g. "security-reviewer"
  // → "Security Reviewer"). Falls back to title-cased id when the ecosystem
  // lookup misses, so unknown ids still render readably.
  const agentName = useMemo(() => {
    const m = new Map<string, string>();
    ecosystem?.agents.forEach((a) => m.set(a.id, a.name));
    return (id?: string): string => {
      if (!id) return "—";
      return displayName(m.get(id) ?? id);
    };
  }, [ecosystem]);

  const visible = useMemo(
    () =>
      events
        .filter((e) => e.kind === "handoff" || e.kind === "verdict")
        .slice(-50),
    [events],
  );

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visible.length]);

  if (!active && visible.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute top-0 left-0 bottom-0 z-20",
        "w-[380px] border-r border-[var(--border-subtle)] backdrop-blur-md",
        "flex flex-col",
      )}
      style={{ background: "var(--cinema-overlay-strong)" }}
      aria-label="Agent call stream"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-4 h-10 border-b border-[var(--border-subtle)] bg-[var(--abyss)]/80">
        <Users size={12} className="text-[var(--blue-bright)]" />
        <span className="text-[10px] uppercase tracking-[0.22em] font-[var(--font-orbitron)] text-[var(--text-dim)]">
          Agent calls
        </span>
        <div className="flex-1" />
      </div>

      {/* Fade gradient at top */}
      <div
        className="absolute top-10 left-0 right-0 h-8 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, var(--cinema-overlay-fade) 0%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Log lines */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
        {visible.map((evt, i) => {
          const isLast = i === visible.length - 1;
          return (
            <AgentLogLine
              key={`${evt.at}-${i}`}
              event={evt}
              startedAt={startedAt}
              fromName={agentName(evt.from)}
              toName={agentName(evt.to)}
              instant={!isLast || !!reducedMotion}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

interface AgentLogLineProps {
  event: TimelineEvent;
  startedAt: number | null;
  fromName: string;
  toName: string;
  instant: boolean;
}

function AgentLogLine({ event, startedAt, fromName, toName, instant }: AgentLogLineProps) {
  const ts = formatTimestamp(startedAt, event.at);

  if (event.kind === "verdict") {
    const color =
      event.verdict === "approved"
        ? "var(--gold-bright)"
        : event.verdict === "blocked"
          ? "var(--live)"
          : "var(--blue-bright)";
    return (
      <div className="text-mono-sm leading-snug break-words mt-1">
        <span className="text-[var(--text-dim)]">[{ts}]</span>{" "}
        <span style={{ color: "var(--blue-bright)" }}>{fromName}</span>
        <span className="text-[var(--text-dim)]"> → </span>
        <span style={{ color: "var(--blue-bright)" }}>{toName}</span>
        <div className="pl-6 leading-snug">
          <span style={{ color, fontWeight: 600 }}>{event.verdict ?? "resolved"}</span>{" "}
          <span style={{ color }}>
            <Typewriter text={event.content} instant={instant} charsPerSec={60} />
          </span>
        </div>
      </div>
    );
  }

  // handoff
  return (
    <div className="text-mono-sm leading-snug break-words">
      <span className="text-[var(--text-dim)]">[{ts}]</span>{" "}
      <span style={{ color: "var(--blue-bright)" }}>{fromName}</span>
      <span className="text-[var(--text-dim)]"> → </span>
      <span style={{ color: "var(--gold-bright)", fontWeight: 600 }}>{toName}</span>
      <div className="pl-6 text-[var(--text-muted)]">
        <Typewriter text={`"${event.content}"`} instant={instant} charsPerSec={70} />
      </div>
    </div>
  );
}

/**
 * Title-case a hyphen / underscore separated id for display.
 *   manager           → Manager
 *   security-reviewer → Security Reviewer
 *   tech_lead         → Tech Lead
 */
function displayName(name: string): string {
  return name
    .split(/[-_]/)
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

/**
 * Render the event's wall-clock timestamp in Europe/Istanbul (UTC+3, no DST).
 *
 * The event stream gives us `startedAt` (epoch ms when the scenario began,
 * fixed by PR #15 to use `Date.now()` instead of `performance.now()`) plus
 * `event.at` (offset into the scenario). Sum is the absolute moment of the
 * event; we format it in Istanbul time as `HH:MM:SS` so the audience sees
 * the local wall clock instead of UTC.
 *
 * `Intl.DateTimeFormat` is cached at module load — formatters are expensive
 * to construct and we render this for every log line.
 */
const ISTANBUL_TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Europe/Istanbul",
});

function formatTimestamp(startedAt: number | null, offsetMs: number): string {
  const epoch = startedAt ?? Date.now();
  return ISTANBUL_TIME.format(new Date(epoch + offsetMs));
}
