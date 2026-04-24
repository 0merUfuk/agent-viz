"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { Ecosystem } from "@/lib/types";
import { layoutEcosystem } from "@/lib/layout";
import { baseStyleFor } from "./edgeStyles";
import { AgentNode } from "./AgentNode";
import { SkillNode } from "./SkillNode";
import { RuleNode } from "./RuleNode";
import { CanvasBackdrop } from "./CanvasBackdrop";
import { useGraph } from "./EcosystemContext";

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  skill: SkillNode,
  rule: RuleNode,
};

export interface EcosystemGraphProps {
  ecosystem: Ecosystem;
}

export function EcosystemGraph({ ecosystem }: EcosystemGraphProps) {
  const { selectedId, setSelected, activeEdgeIds } = useGraph();

  const { nodes, edges } = useMemo(
    () => buildFlowGraph(ecosystem, selectedId, activeEdgeIds),
    [ecosystem, selectedId, activeEdgeIds],
  );

  const handleNodeClick = useCallback(
    (_: unknown, node: RFNode) => setSelected(node.id),
    [setSelected],
  );

  const handlePaneClick = useCallback(() => setSelected(null), [setSelected]);

  return (
    <div className="relative h-full w-full">
      <CanvasBackdrop />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.15, duration: 400 }}
        minZoom={0.4}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        zoomOnPinch
        panOnDrag
      >
        <Background color="transparent" gap={0} size={0} />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function buildFlowGraph(
  ecosystem: Ecosystem,
  selectedId: string | null,
  activeEdgeIds: ReadonlySet<string>,
): { nodes: RFNode[]; edges: RFEdge[] } {
  const positions = layoutEcosystem(ecosystem);
  const posIndex = new Map(positions.map((p) => [p.id, p]));

  const nodes: RFNode[] = positions.map((p) => {
    const common = {
      id: p.id,
      position: { x: p.x, y: p.y },
      draggable: false,
      selectable: true,
    } as const;

    if (p.kind === "agent") {
      const agent = ecosystem.agents.find((a) => a.id === p.id)!;
      return { ...common, type: "agent", data: { agent } };
    }
    if (p.kind === "skill") {
      const skill = ecosystem.skills.find((s) => s.id === p.id)!;
      return { ...common, type: "skill", data: { skill } };
    }
    const rule = ecosystem.rules.find((r) => r.id === p.id)!;
    return { ...common, type: "rule", data: { rule } };
  });

  const edges: RFEdge[] = ecosystem.edges
    .filter((e) => posIndex.has(e.source) && posIndex.has(e.target))
    .map((e) => {
      const isActive = activeEdgeIds.has(e.id);
      const related =
        selectedId !== null &&
        (e.source === selectedId || e.target === selectedId);
      const highlight: "normal" | "active" | "faded" = isActive
        ? "active"
        : selectedId
          ? related
            ? "normal"
            : "faded"
          : "normal";

      const style = baseStyleFor(e.kind, highlight);

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: "default",
        className: isActive ? "edge-active" : undefined,
        style,
        markerEnd:
          e.kind === "agent-spawns-agent"
            ? {
                type: MarkerType.ArrowClosed,
                color: style.stroke as string,
                width: 14,
                height: 14,
              }
            : undefined,
      };
    });

  return { nodes, edges };
}
