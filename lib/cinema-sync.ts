"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Ecosystem } from "./types";
import type { ScenarioId } from "@/components/scenarios/scripts";

/**
 * Cross-tab state sync for the two-route cinema architecture.
 *
 *   /        (audience)  reads everything, can click nodes to select
 *   /stage   (presenter) writes everything (mode, scenario, ecosystem)
 *
 * State is synced via BroadcastChannel where available, with a
 * localStorage-event fallback so a single-tab usage model still works
 * (e.g. presenter rehearsing on their laptop before the meetup).
 *
 * The ecosystem payload can be hundreds of KB — we clamp persistence
 * to localStorage's 5MB quota gracefully.
 */

export interface CinemaState {
  ecosystem: Ecosystem | null;
  mode: "demo" | "live";
  liveAvailable: boolean;
  activeScenario: ScenarioId | null;
  running: boolean;
  selectedId: string | null;
  /** Monotonic counter — presenter bumps on manual re-trigger so audience re-renders */
  epoch: number;
}

export const INITIAL_CINEMA_STATE: CinemaState = {
  ecosystem: null,
  mode: "demo",
  liveAvailable: false,
  activeScenario: null,
  running: false,
  selectedId: null,
  epoch: 0,
};

const CHANNEL_NAME = "agent-viz-cinema-v1";
// v2: invalidate any pre-parser-fix cached ecosystems. Browsers that loaded
// agent-viz before commit 31d3d17 (multi-arg Agent split fix) persisted broken
// ecosystems with fragmented `Agent(a, b, c)` edges into v1; bumping the key
// forces a fresh fetch on next mount instead of rehydrating stale broken state.
const LS_KEY = "agent-viz-cinema-state-v2";

type Message =
  | { type: "state"; payload: CinemaState; ts: number }
  | { type: "hello"; ts: number };

export type CinemaUpdater = (prev: CinemaState) => CinemaState;

export function useCinemaSync(
  initial: CinemaState = INITIAL_CINEMA_STATE,
): readonly [CinemaState, (updater: CinemaUpdater) => void] {
  const [state, setState] = useState<CinemaState>(initial);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastTsRef = useRef<number>(0);
  const stateRef = useRef<CinemaState>(state);
  stateRef.current = state;

  // Bootstrap from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CinemaState;
        setState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Corrupt storage; fall back to initial.
    }
  }, []);

  // Subscribe to BroadcastChannel + storage events.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (e: MessageEvent<Message>) => {
        const msg = e.data;
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "state") {
          // Reject out-of-order messages.
          if (msg.ts < lastTsRef.current) return;
          lastTsRef.current = msg.ts;
          setState(msg.payload);
        } else if (msg.type === "hello") {
          // Another tab came online — broadcast our current state to sync it.
          bc?.postMessage({ type: "state", payload: stateRef.current, ts: Date.now() });
        }
      };
      channelRef.current = bc;
      // Announce arrival so any other tab can broadcast their state to us.
      bc.postMessage({ type: "hello", ts: Date.now() });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as CinemaState;
        setState(parsed);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      bc?.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((updater: CinemaUpdater) => {
    setState((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
      const ts = Date.now();
      lastTsRef.current = ts;
      // Persist.
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        // Quota / private mode — drop silently; BroadcastChannel still works.
      }
      // Broadcast.
      channelRef.current?.postMessage({ type: "state", payload: next, ts });
      return next;
    });
  }, []);

  return [state, update] as const;
}
