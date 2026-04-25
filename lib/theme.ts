/**
 * Theme system — `light` | `dark` keyed off a `data-theme` attribute on
 * `<html>`. Persisted in `localStorage` so the choice survives reloads, and
 * synced across same-origin tabs via the `storage` event so the audience
 * tab follows the presenter's toggle without needing a cinema-sync round trip.
 *
 * The applied theme is set BEFORE paint by a small inline script in
 * `app/layout.tsx`. This module is what runs after hydration: it provides a
 * React hook for components to read/write the theme reactively.
 */

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "agent-viz-theme-v1";
export const DEFAULT_THEME: Theme = "dark";

/** Read the persisted theme from localStorage. SSR-safe. */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    // localStorage can throw in private mode / sandboxed iframes — fall through
  }
  return null;
}

/** Persist the theme. SSR-safe. Failures are silent. */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Persistence failure shouldn't break the toggle
  }
}

/** Apply the theme to `<html>`. SSR-safe. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * React hook: reactively read the current theme and toggle it.
 *
 * On mount, syncs with whatever the inline script set on `<html>` (or the
 * stored value, whichever is present). Subscribes to storage events so a
 * theme change in another tab (e.g., presenter toggling on `/stage`)
 * propagates to this one (e.g., audience on `/`).
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    // Sync initial state with whatever the inline script applied
    const fromAttr = document.documentElement.getAttribute("data-theme");
    if (fromAttr === "light" || fromAttr === "dark") {
      setThemeState(fromAttr);
    } else {
      const stored = getStoredTheme();
      setThemeState(stored ?? DEFAULT_THEME);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next: Theme = e.newValue === "light" ? "light" : "dark";
      setThemeState(next);
      applyTheme(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setStoredTheme(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      setStoredTheme(next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme, setTheme };
}
