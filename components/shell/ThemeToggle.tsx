"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

/**
 * Theme toggle button. Switches between light and dark modes; persists choice
 * in localStorage and applies `data-theme` to `<html>`. The change auto-syncs
 * to other same-origin tabs via the `storage` event (see `lib/theme.ts`).
 *
 * Renders a sun icon while in dark mode (click to go light) and a moon icon
 * in light mode (click to go dark). Sized to match the existing Header
 * `ModeButton` height so it sits cleanly next to the Mode toggle.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={!isDark}
      className={cn(
        "flex items-center justify-center h-9 w-9 border border-[var(--border-subtle)]",
        "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]",
        "transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--blue-star)]",
      )}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
