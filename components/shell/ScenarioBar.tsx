"use client";

import { Play, Square } from "lucide-react";
import { cn } from "@/lib/cn";

export type ScenarioId = "s1-review" | "s2-strategy" | "s3-pipeline";

export interface ScenarioDescriptor {
  id: ScenarioId;
  title: string;
  subtitle: string;
  durationMs: number;
}

export interface ScenarioBarProps {
  scenarios: ScenarioDescriptor[];
  activeId: ScenarioId | null;
  running: boolean;
  canRun: boolean;
  onRun: (id: ScenarioId) => void;
  onCancel: () => void;
}

export function ScenarioBar({
  scenarios,
  activeId,
  running,
  canRun,
  onRun,
  onCancel,
}: ScenarioBarProps) {
  return (
    <div className="relative z-10 h-14 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--abyss)]">
      <div className="flex h-full items-center gap-2 px-6">
        <span className="text-display-sm text-[var(--text-dim)] pr-4 hidden sm:inline">
          Scenarios
        </span>

        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {scenarios.map((s) => {
            const isActive = activeId === s.id;
            const isDisabled = !canRun || (running && !isActive);
            return (
              <button
                key={s.id}
                type="button"
                disabled={isDisabled}
                onClick={() => (running && isActive ? onCancel() : onRun(s.id))}
                className={cn(
                  "scenario-btn group flex h-9 items-center gap-2 border px-3 transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  isActive && running
                    ? "border-[var(--gold)] bg-[rgba(232,201,112,0.06)] text-[var(--text)]"
                    : "border-[var(--border-subtle)] bg-[var(--void)] text-[var(--text-muted)] hover:border-[var(--border-active)] hover:text-[var(--text)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center",
                    isActive && running ? "text-[var(--gold-bright)]" : "text-[var(--blue-bright)] group-hover:text-[var(--blue-star)]",
                  )}
                >
                  {isActive && running ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                </span>
                <span className="text-[11px] uppercase tracking-[0.14em] font-[var(--font-orbitron)] font-medium">
                  {s.title}
                </span>
                <span className="hidden md:inline text-[10px] uppercase tracking-[0.16em] font-[var(--font-orbitron)] text-[var(--text-dim)]">
                  {s.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {running ? (
          <span className="text-display-sm text-[var(--live)] animate-pulse hidden sm:inline">Running</span>
        ) : canRun ? (
          <span className="text-display-sm text-[var(--text-dim)] hidden sm:inline">Ready</span>
        ) : (
          <span className="text-display-sm text-[var(--text-dim)] hidden sm:inline">Load ecosystem</span>
        )}
      </div>
    </div>
  );
}
