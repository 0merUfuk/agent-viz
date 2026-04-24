"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ScenarioId, TimelineEvent } from "./scripts";
import { findScenario } from "./scripts";
import { jitter } from "@/lib/jitter";

/**
 * Scenario event stream.
 *
 * A single source-of-truth in-memory buffer that the HandoffStrip,
 * ToolCallStream and CinemaHUD all subscribe to. Events flow in
 * chronologically as the scenario plays; listeners render them.
 *
 * Events are not persisted cross-tab — the presenter triggers scenarios
 * from /stage; each route that cares about events runs its own local
 * scheduler bound to cinema.activeScenario. This keeps the sync payload
 * small (no firehose of timeline events over BroadcastChannel) while
 * still keeping the audience perfectly in step because their scheduler
 * starts at the moment `running` flips true via sync.
 */

export interface EventStreamState {
  events: TimelineEvent[];
  active: boolean;
  scenarioId: ScenarioId | null;
  startedAt: number | null;
}

export interface EventStreamContextValue extends EventStreamState {
  latestVerdict: TimelineEvent | null;
}

const EventStreamContext = createContext<EventStreamContextValue | null>(null);

export function EventStreamProvider({
  scenarioId,
  running,
  reducedMotion,
  children,
}: {
  scenarioId: ScenarioId | null;
  running: boolean;
  reducedMotion?: boolean;
  children: ReactNode;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }, []);

  // Schedule the whole timeline when running flips on.
  useEffect(() => {
    clearTimers();
    if (!running || !scenarioId) {
      setEvents([]);
      setStartedAt(null);
      return;
    }
    const scenario = findScenario(scenarioId);
    if (!scenario) return;

    const start = performance.now();
    setStartedAt(start);
    setEvents([]);

    // Under reduced motion, compress the schedule so the demo is watchable
    // without motion but still conveys order.
    const scale = reducedMotion ? 0.35 : 1;

    // Lock a single jitter seed for this run so all placeholders resolve to
    // consistent values across the scenario (and across re-renders).
    const seed = Math.floor(Date.now() / 60_000);
    const resolve = (evt: TimelineEvent): TimelineEvent => ({
      ...evt,
      content: jitter(evt.content, { scenarioId: scenario.id, seed }),
    });

    scenario.timeline.forEach((evt) => {
      const resolved = resolve(evt);
      const t = setTimeout(() => {
        setEvents((prev) => [...prev, resolved]);
      }, evt.at * scale);
      timeouts.current.push(t);
    });

    return () => {
      clearTimers();
    };
  }, [scenarioId, running, reducedMotion, clearTimers]);

  const latestVerdict = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].kind === "verdict") return events[i];
    }
    return null;
  }, [events]);

  const value = useMemo<EventStreamContextValue>(
    () => ({
      events,
      active: !!running && !!scenarioId,
      scenarioId,
      startedAt,
      latestVerdict,
    }),
    [events, running, scenarioId, startedAt, latestVerdict],
  );

  return (
    <EventStreamContext.Provider value={value}>{children}</EventStreamContext.Provider>
  );
}

export function useEventStream(): EventStreamContextValue {
  const ctx = useContext(EventStreamContext);
  if (!ctx) {
    return {
      events: [],
      active: false,
      scenarioId: null,
      startedAt: null,
      latestVerdict: null,
    };
  }
  return ctx;
}
