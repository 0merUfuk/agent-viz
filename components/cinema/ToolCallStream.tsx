"use client";

import { useEffect, useMemo, useRef } from "react";
import { Terminal } from "lucide-react";
import { useEventStream } from "@/components/scenarios/eventStream";
import { Typewriter } from "./Typewriter";
import type { TimelineEvent } from "@/components/scenarios/scripts";
import { cn } from "@/lib/cn";

/**
 * Right-side terminal overlay. Renders every event as a monospace log line
 * with syntax-coloured tokens (agent name, tool verb, file target).
 * Auto-scrolls to the latest line.
 */

const TOOL_COLORS: Record<string, string> = {
  Read:       "var(--blue-bright)",
  Write:      "var(--gold-bright)",
  Edit:       "var(--gold-bright)",
  Bash:       "#c084fc", // magenta — exec
  Grep:       "var(--blue-star)",
  Glob:       "var(--blue-star)",
  Agent:      "var(--gold-bright)",
  WebSearch:  "#86efac", // green — net
  WebFetch:   "#86efac",
};

export function ToolCallStream({ reducedMotion }: { reducedMotion?: boolean }) {
  const { events, active, startedAt } = useEventStream();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  const visible = useMemo(
    () => events.filter((e) => e.kind !== "handoff").slice(-50),
    [events],
  );

  if (!active && events.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute top-0 right-0 bottom-0 z-20",
        "w-[380px] border-l border-[var(--border-subtle)] bg-[rgba(0,0,0,0.55)] backdrop-blur-md",
        "flex flex-col",
      )}
      aria-label="Tool call stream"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-4 h-10 border-b border-[var(--border-subtle)] bg-[var(--abyss)]/80">
        <Terminal size={12} className="text-[var(--blue-bright)]" />
        <span className="text-[10px] uppercase tracking-[0.22em] font-[var(--font-orbitron)] text-[var(--text-dim)]">
          Tool call stream
        </span>
        <div className="flex-1" />
        <span className="text-[10px] uppercase tracking-[0.22em] font-[var(--font-orbitron)] text-[var(--live)]">
          ● Live
        </span>
      </div>

      {/* Fade gradient at top */}
      <div
        className="absolute top-10 left-0 right-0 h-8 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Log lines */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
        {visible.map((evt, i) => {
          const isLast = i === visible.length - 1;
          return (
            <LogLine
              key={`${evt.at}-${i}`}
              event={evt}
              startedAt={startedAt}
              instant={!isLast || !!reducedMotion}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

interface LogLineProps {
  event: TimelineEvent;
  startedAt: number | null;
  instant: boolean;
}

function LogLine({ event, startedAt, instant }: LogLineProps) {
  const ts = formatTimestamp(startedAt, event.at);
  const agent = event.from ?? "system";

  if (event.kind === "tool") {
    const toolColor = TOOL_COLORS[event.tool ?? ""] ?? "var(--text)";
    const target = event.target ? truncateTarget(event.target) : "";
    return (
      <div className="text-mono-sm leading-snug break-all">
        <span className="text-[var(--text-dim)]">[{ts}]</span>{" "}
        <span style={{ color: "var(--blue-bright)" }}>{agent.padEnd(18)}</span>
        <span className="text-[var(--text-dim)]">→ </span>
        <span style={{ color: toolColor, fontWeight: 600 }}>{event.tool}</span>
        <span className="text-[var(--text-dim)]">(</span>
        {target && <span className="text-[var(--text-muted)]">{target}</span>}
        <span className="text-[var(--text-dim)]">)</span>
        {event.content && (
          <div className="pl-6 text-[var(--text-dim)]">
            <Typewriter text={`# ${event.content}`} instant={instant} charsPerSec={80} />
          </div>
        )}
      </div>
    );
  }

  if (event.kind === "verdict") {
    const color =
      event.verdict === "approved"
        ? "var(--gold-bright)"
        : event.verdict === "blocked"
          ? "var(--live)"
          : "var(--blue-bright)";
    return (
      <div className="text-mono-sm leading-snug break-all mt-1">
        <span className="text-[var(--text-dim)]">[{ts}]</span>{" "}
        <span style={{ color }}>VERDICT</span>{" "}
        <span style={{ color, fontWeight: 600 }}>
          <Typewriter text={event.content} instant={instant} charsPerSec={60} />
        </span>
      </div>
    );
  }

  // handoff / message
  const color = event.kind === "handoff" ? "var(--blue-bright)" : "var(--text-muted)";
  return (
    <div className="text-mono-sm leading-snug break-all">
      <span className="text-[var(--text-dim)]">[{ts}]</span>{" "}
      <span style={{ color: "var(--blue-bright)" }}>{agent.padEnd(18)}</span>
      <span style={{ color }}>
        <Typewriter
          text={event.kind === "handoff" ? `→ ${event.to} "${event.content}"` : `· ${event.content}`}
          instant={instant}
          charsPerSec={70}
        />
      </span>
    </div>
  );
}

function formatTimestamp(startedAt: number | null, offsetMs: number): string {
  if (!startedAt) return "00:00:00";
  const absolute = new Date(startedAt + offsetMs);
  return absolute.toISOString().slice(11, 19);
}

function truncateTarget(target: string, max = 36): string {
  if (target.length <= max) return target;
  const keep = max - 1;
  const head = Math.floor(keep * 0.4);
  const tail = keep - head;
  return `${target.slice(0, head)}…${target.slice(-tail)}`;
}
