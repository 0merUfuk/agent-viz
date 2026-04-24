"use client";

import { createContext, useContext } from "react";
import type { Ecosystem } from "@/lib/types";

export interface GraphState {
  ecosystem: Ecosystem | null;
  selectedId: string | null;
  activeNodeIds: ReadonlySet<string>;
  activeEdgeIds: ReadonlySet<string>;
  setSelected: (id: string | null) => void;
}

const GraphContext = createContext<GraphState | null>(null);

export function GraphProvider({
  value,
  children,
}: {
  value: GraphState;
  children: React.ReactNode;
}) {
  return <GraphContext.Provider value={value}>{children}</GraphContext.Provider>;
}

export function useGraph(): GraphState {
  const ctx = useContext(GraphContext);
  if (!ctx) throw new Error("useGraph must be used within <GraphProvider>");
  return ctx;
}

export function useIsActive(id: string): boolean {
  const { activeNodeIds } = useGraph();
  return activeNodeIds.has(id);
}

export function useRelatedHighlight(id: string): "selected" | "related" | "faded" | "normal" {
  const { selectedId, ecosystem } = useGraph();
  if (!selectedId || !ecosystem) return "normal";
  if (selectedId === id) return "selected";
  const related = ecosystem.edges.some(
    (e) =>
      (e.source === selectedId && e.target === id) ||
      (e.target === selectedId && e.source === id),
  );
  return related ? "related" : "faded";
}
