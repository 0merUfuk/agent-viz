"use client";

import Image from "next/image";
import Link from "next/link";
import { FolderOpen, Zap, PlayCircle } from "lucide-react";
import { PortalButton } from "@/components/ui/PortalButton";
import { cn } from "@/lib/cn";

export type Mode = "demo" | "live";

export interface HeaderProps {
  mode: Mode;
  liveAvailable: boolean;
  onModeChange: (mode: Mode) => void;
  onOpenLoader: () => void;
  /** "cinema" = audience view on `/`, minimal chrome + discreet Stage link.
   *  "stage"  = presenter view on `/stage`, full control chrome. */
  variant: "cinema" | "stage";
}

export function Header({
  mode,
  liveAvailable,
  onModeChange,
  onOpenLoader,
  variant,
}: HeaderProps) {
  const isStage = variant === "stage";
  return (
    <header className="relative z-20 h-16 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--void)]">
      <div className="flex h-full items-center gap-6 px-6">
        {/* Conference logo */}
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-[var(--gold-deep)]/60 bg-[var(--void)] shadow-[0_0_12px_rgba(96,165,250,0.25)]">
            <Image
              src="/agent-viz-logo.jpeg"
              alt="Age of AI — What's Going On? Edition"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </div>
          <div className="hidden md:block pl-3 ml-1 border-l border-[var(--border-subtle)]">
            <span className="text-display-sm text-[var(--blue-bright)] block">
              Agent Ecosystem Visualizer
            </span>
            {isStage && (
              <span className="text-[10px] uppercase tracking-[0.22em] font-[var(--font-orbitron)] text-[var(--gold-bright)] mt-0.5 block">
                Stage · Presenter
              </span>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {isStage ? (
          <>
            {/* Back to cinema */}
            <Link
              href="/"
              className="text-[10px] uppercase tracking-[0.22em] font-[var(--font-orbitron)] text-[var(--text-dim)] hover:text-[var(--blue-bright)] transition-colors"
            >
              ← Cinema
            </Link>

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
            <PortalButton
              icon={<FolderOpen size={14} />}
              onClick={onOpenLoader}
            >
              Load repo
            </PortalButton>
          </>
        ) : (
          <>
            {/* Discreet Stage link — audience-safe; reads as a generic system icon. */}
            <Link
              href="/stage"
              aria-label="Open presenter stage"
              className="group flex items-center gap-1.5 text-[var(--gold-deep)] hover:text-[var(--gold-bright)] transition-colors opacity-50 hover:opacity-100"
              style={{ fontSize: 10 }}
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 rotate-45 border border-current transition-transform group-hover:scale-125"
              />
              <span className="uppercase tracking-[0.22em] font-[var(--font-orbitron)]">
                Stage
              </span>
            </Link>
          </>
        )}
      </div>

      {/* Animated gold hairline sweep — subtle ambient motion */}
      <div
        className="absolute bottom-[-1px] left-4 right-4 h-px"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(138,106,30,0.35) 25%, rgba(232,201,112,0.75) 50%, rgba(138,106,30,0.35) 75%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "hairline-sweep 8s ease-in-out infinite",
        }}
      />
    </header>
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
