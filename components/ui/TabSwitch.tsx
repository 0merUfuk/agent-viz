"use client";

import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export interface TabSwitchProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

export function TabSwitch<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabSwitchProps<T>) {
  return (
    <div
      className={cn(
        "flex border-b border-[var(--border-subtle)]",
        className,
      )}
      role="tablist"
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 h-10 text-[11px] uppercase tracking-[0.18em] font-[var(--font-orbitron)] transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--blue-star)]",
              active
                ? "text-[var(--gold-bright)]"
                : "text-[var(--text-dim)] hover:text-[var(--text)]",
            )}
          >
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "text-mono-sm border px-1.5",
                  active
                    ? "border-[var(--gold-deep)] text-[var(--gold-bright)]"
                    : "border-[var(--border-subtle)] text-[var(--text-dim)]",
                )}
              >
                {t.count}
              </span>
            )}
            {active && (
              <span
                className="absolute bottom-[-1px] left-2 right-2 h-[2px]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, transparent 0%, var(--gold-bright) 50%, transparent 100%)",
                }}
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
