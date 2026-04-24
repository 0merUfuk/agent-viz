"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BridgeClient,
  type BridgeEvent,
  abortBridge,
  runScenario,
} from "@/lib/bridge-client";
import type { Ecosystem } from "@/lib/types";
import type { ScenarioId } from "./scripts";

export interface LivePlayerState {
  activeNodeIds: ReadonlySet<string>;
  activeEdgeIds: ReadonlySet<string>;
  currentLabel: string | undefined;
  sessionId: string | null;
  error: string | null;
}

const EMPTY = new Set<string>();

export interface LivePlayerOptions {
  scenarioId: ScenarioId | null;
  running: boolean;
  ecosystem: Ecosystem | null;
  onComplete: () => void;
  onStall: () => void;
}

/**
 * Live-mode player.
 *   - When `running` flips true with a scenarioId, POST /run to the bridge.
 *   - Subscribes to WS events; maps hook:pre-tool-use payloads to nodes.
 *   - If no events arrive for 30 seconds, calls onStall.
 */
export function useLivePlayer({
  scenarioId,
  running,
  ecosystem,
  onComplete,
  onStall,
}: LivePlayerOptions): LivePlayerState {
  const [active, setActive] = useState<ReadonlySet<string>>(EMPTY);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientRef = useRef<BridgeClient | null>(null);

  const agentIds = useMemo(
    () => new Set(ecosystem?.agents.map((a) => a.id) ?? []),
    [ecosystem],
  );

  // Ensure a single long-lived client.
  useEffect(() => {
    const client = new BridgeClient();
    clientRef.current = client;
    client.connect();
    return () => {
      client.close();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!running || !scenarioId) {
      setActive(EMPTY);
      setLabel(undefined);
      setError(null);
      return;
    }
    const client = clientRef.current;
    if (!client) return;

    let cancelled = false;

    const resetStall = () => {
      if (stallTimer.current) clearTimeout(stallTimer.current);
      stallTimer.current = setTimeout(() => {
        if (!cancelled) onStall();
      }, 30_000);
    };

    const unsubscribe = client.subscribe((ev: BridgeEvent) => {
      resetStall();
      handleEvent(ev);
    });

    const handleEvent = (ev: BridgeEvent) => {
      if (ev.sessionId && ev.sessionId !== sessionId && ev.kind === "session_started") {
        setSessionId(ev.sessionId);
      }
      if (ev.kind === "session_started") {
        setLabel("Live session started");
      }
      if (ev.kind === "session_error") {
        setError(ev.message ?? "Bridge reported an error");
      }
      if (ev.kind === "session_end") {
        setLabel("Live session complete");
        setActive(EMPTY);
        onComplete();
      }
      // Map hook:pre-tool-use payloads containing subagent_type → node highlight
      if (ev.kind === "hook:pre-tool-use" || ev.kind === "hook:subagent-stop") {
        const subagent = extractSubagentType(ev.payload);
        if (subagent && agentIds.has(subagent)) {
          setActive(new Set([subagent]));
          setLabel(`${ev.kind === "hook:pre-tool-use" ? "Invoke" : "Complete"}: ${subagent}`);
        } else if (ev.kind === "hook:pre-tool-use") {
          const tool = extractToolName(ev.payload);
          if (tool) setLabel(`Tool: ${tool}`);
        }
      }
    };

    // Kick off the run
    (async () => {
      resetStall();
      setError(null);
      const result = await runScenario(scenarioId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error ?? "Failed to reach bridge");
        onStall();
        return;
      }
      setSessionId(result.sessionId ?? null);
    })();

    return () => {
      cancelled = true;
      unsubscribe();
      if (stallTimer.current) clearTimeout(stallTimer.current);
      // Best-effort abort if unmounted mid-run
      abortBridge();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, scenarioId, agentIds]);

  return {
    activeNodeIds: active,
    activeEdgeIds: EMPTY,
    currentLabel: label,
    sessionId,
    error,
  };
}

function extractSubagentType(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  // tool_input.subagent_type
  const ti = p.tool_input as Record<string, unknown> | undefined;
  if (ti && typeof ti.subagent_type === "string") return ti.subagent_type;
  if (typeof p.subagent_type === "string") return p.subagent_type;
  return null;
}

function extractToolName(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.tool_name === "string") return p.tool_name;
  return null;
}
