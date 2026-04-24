"use client";

import { FolderOpen, Zap, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type Mode = "demo" | "live";

export interface HeaderProps {
  mode: Mode;
  liveAvailable: boolean;
  onModeChange: (mode: Mode) => void;
  onOpenLoader: () => void;
}

export function Header({ mode, liveAvailable, onModeChange, onOpenLoader }: HeaderProps) {
  return (
    <header className="relative z-20 h-16 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--void)]">
      <div className="flex h-full items-center gap-6 px-6">
        {/* Logomark */}
        <div className="flex items-center gap-3">
          <Logomark />
          <div className="hidden md:block pl-3 ml-1 border-l border-[var(--border-subtle)]">
            <span className="text-display-sm text-[var(--blue-bright)] block">
              Agent Ecosystem Visualizer
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Mode toggle */}
        <div className="flex items-center border border-[var(--border-subtle)]">
          <ModeButton
            active={mode === "demo"}
            onClick={() => onModeChange("demo")}
            icon={<PlayCircle size={14} />}
            label="Demo"
          />
          <ModeButton
            active={mode === "live"}
            disabled={!liveAvailable}
            onClick={() => liveAvailable && onModeChange("live")}
            icon={<Zap size={14} />}
            label="Live"
            title={liveAvailable ? undefined : "Bridge not running — start bridge/server.js on localhost:4001"}
          />
        </div>

        {/* Load repo */}
        <Button variant="primary" onClick={onOpenLoader} className="gap-2">
          <FolderOpen size={14} />
          <span>Load repo</span>
        </Button>
      </div>

      {/* Inset gold hairline */}
      <div className="absolute bottom-[-1px] left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--gold-deep)]/40 to-transparent" />
    </header>
  );
}

function Logomark() {
  return (
    <div className="relative flex items-baseline">
      <span
        className="text-[28px] leading-none tracking-[0.04em] font-[var(--font-cinzel)] font-bold gold-gradient"
        aria-hidden
      >
        agent
      </span>
      <span
        className="text-[28px] leading-none tracking-[0.04em] font-[var(--font-cinzel)] font-bold text-[var(--text)]"
        aria-hidden
      >
        -viz
      </span>
      <span className="sr-only">agent-viz</span>
    </div>
  );
}

interface ModeButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title?: string;
}

function ModeButton({ active, disabled, onClick, icon, label, title }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 px-3 h-9 text-label transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--blue-star)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-[var(--surface-hi)] text-[var(--text)]"
          : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]",
      )}
    >
      <span className={active ? "text-[var(--blue-bright)]" : ""}>{icon}</span>
      <span className="uppercase tracking-[0.14em] text-[11px] font-[var(--font-orbitron)]">
        {label}
      </span>
    </button>
  );
}
