import type { Edge as RFEdge } from "@xyflow/react";
import type { EdgeKind } from "@/lib/types";

export interface StyledEdge extends Omit<RFEdge, "id"> {
  id: string;
  data?: { kind: EdgeKind };
}

export function baseStyleFor(kind: EdgeKind, highlight: "normal" | "active" | "faded") {
  const opacity = highlight === "faded" ? 0.15 : 1;
  switch (kind) {
    case "skill-spawns-agent":
      return {
        stroke: "var(--blue)",
        strokeWidth: 1.5,
        strokeDasharray: "4 3",
        opacity,
      };
    case "agent-spawns-agent":
      return {
        stroke: highlight === "active" ? "var(--blue-star)" : "var(--blue-bright)",
        strokeWidth: highlight === "active" ? 2 : 1.5,
        opacity,
      };
    case "agent-uses-rule":
      return {
        stroke: "var(--text-dim)",
        strokeWidth: 1,
        strokeDasharray: "1 3",
        opacity,
      };
  }
}
