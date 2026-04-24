"use client";

import { cn } from "@/lib/cn";

export type StatusState = "idle" | "loading" | "running" | "error" | "ready" | "complete";

export interface StatusBarProps {
  state: StatusState;
  message?: string;
  agentCount: number;
  skillCount: number;
  ruleCount: number;
  sourceLabel?: string;
  mode: "demo" | "live";
}

const stateConfig: Record<StatusState, { dotClass: string; label: string }> = {
  idle:     { dotClass: "bg-[var(--text-dim)]",     label: "Idle" },
  loading:  { dotClass: "bg-[var(--blue-bright)] animate-pulse", label: "Loading" },
  running:  { dotClass: "bg-[var(--live)] animate-pulse",       label: "Running" },
  error:    { dotClass: "bg-[var(--live)]",                       label: "Error" },
  ready:    { dotClass: "bg-[var(--success)]",                    label: "Ready" },
  complete: { dotClass: "bg-[var(--gold-bright)]",                label: "Complete" },
};

export function StatusBar({
  state,
  message,
  agentCount,
  skillCount,
  ruleCount,
  sourceLabel,
  mode,
}: StatusBarProps) {
  const cfg = stateConfig[state];

  return (
    <footer className="relative z-10 h-8 shrink-0 border-t border-[var(--border-subtle)] bg-[var(--abyss)]">
      <div className="flex h-full items-center gap-4 px-6 text-label">
        <span className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", cfg.dotClass)} aria-hidden />
          <span
            className={cn(
              "uppercase tracking-[0.16em] font-[var(--font-orbitron)] text-[10px]",
              state === "complete"
                ? "text-[var(--gold-bright)]"
                : state === "running"
                  ? "text-[var(--live)]"
                  : "text-[var(--text-muted)]",
            )}
          >
            {message ?? cfg.label}
          </span>
        </span>

        <Divider />

        <span className="text-[var(--text-muted)]">
          <span className="text-[var(--text)]">{agentCount}</span> agents
          <Dot /> <span className="text-[var(--text)]">{skillCount}</span> skills
          <Dot /> <span className="text-[var(--text)]">{ruleCount}</span> rules
        </span>

        <div className="flex-1" />

        {sourceLabel && (
          <span className="text-mono-sm text-[var(--text-dim)] hidden sm:inline">
            {sourceLabel}
          </span>
        )}

        <Divider />

        <span
          className={cn(
            "uppercase tracking-[0.16em] font-[var(--font-orbitron)] text-[10px]",
            mode === "live" ? "text-[var(--live)]" : "text-[var(--blue-bright)]",
          )}
        >
          {mode === "live" ? "Live Mode" : "Demo Mode"}
        </span>
      </div>
    </footer>
  );
}

function Dot() {
  return <span className="mx-2 text-[var(--text-dim)]">·</span>;
}

function Divider() {
  return <span className="h-4 w-px bg-[var(--border-subtle)]" aria-hidden />;
}
