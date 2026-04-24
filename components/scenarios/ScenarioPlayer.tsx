"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { findScenario, type ScenarioId } from "./scripts";

export interface ScenarioRunState {
  activeNodeIds: ReadonlySet<string>;
  activeEdgeIds: ReadonlySet<string>;
  currentLabel: string | undefined;
  stepIndex: number;
  totalSteps: number;
  completed: boolean;
}

export interface ScenarioPlayerOptions {
  scenarioId: ScenarioId | null;
  running: boolean;
  onComplete: () => void;
  onAbort?: () => void;
  reducedMotion?: boolean;
}

const EMPTY = new Set<string>();

export function useScenarioPlayer({
  scenarioId,
  running,
  onComplete,
  reducedMotion,
}: ScenarioPlayerOptions): ScenarioRunState {
  const [activeNodeIds, setActiveNodeIds] = useState<ReadonlySet<string>>(EMPTY);
  const [activeEdgeIds, setActiveEdgeIds] = useState<ReadonlySet<string>>(EMPTY);
  const [currentLabel, setCurrentLabel] = useState<string | undefined>(undefined);
  const [stepIndex, setStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setActiveNodeIds(EMPTY);
    setActiveEdgeIds(EMPTY);
    setCurrentLabel(undefined);
    setStepIndex(0);
    setTotalSteps(0);
    setCompleted(false);
  }, []);

  useEffect(() => {
    if (!running || !scenarioId) {
      reset();
      return;
    }

    const scenario = findScenario(scenarioId);
    if (!scenario) {
      reset();
      return;
    }

    setTotalSteps(scenario.steps.length);
    setCompleted(false);
    let cancelled = false;
    let i = 0;

    const playNext = () => {
      if (cancelled) return;
      if (i >= scenario.steps.length) {
        setCompleted(true);
        onComplete();
        return;
      }
      const step = scenario.steps[i];
      setActiveNodeIds(new Set(step.nodeIds));
      setActiveEdgeIds(new Set(step.edgeIds ?? []));
      setCurrentLabel(step.label);
      setStepIndex(i);

      const delay = reducedMotion ? 600 : step.durationMs;
      timerRef.current = setTimeout(() => {
        i += 1;
        playNext();
      }, delay);
    };

    playNext();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, scenarioId, onComplete, reducedMotion, reset]);

  return {
    activeNodeIds,
    activeEdgeIds,
    currentLabel,
    stepIndex,
    totalSteps,
    completed,
  };
}
