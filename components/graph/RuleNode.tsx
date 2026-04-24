"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import type { Rule } from "@/lib/types";
import { useRelatedHighlight } from "./EcosystemContext";

export interface RuleNodeData extends Record<string, unknown> {
  rule: Rule;
}

function RuleNodeImpl({ data }: NodeProps) {
  const { rule } = data as RuleNodeData;
  const highlight = useRelatedHighlight(rule.id);
  const isSelected = highlight === "selected";
  const opacity = highlight === "faded" ? 0.2 : 1;

  return (
    <div
      className={cn(
        "flex h-[28px] w-[140px] select-none items-center justify-center px-3",
        "transition-[opacity] duration-200 ease-out",
      )}
      style={{
        opacity,
        border: `1px dashed ${isSelected ? "var(--blue-bright)" : "var(--border-subtle)"}`,
        background: "transparent",
      }}
    >
      <span
        className={cn(
          "block truncate text-[10px] uppercase tracking-[0.16em] font-[var(--font-orbitron)]",
          isSelected ? "text-[var(--blue-bright)]" : "text-[var(--text-muted)]",
        )}
      >
        {rule.name}
      </span>
    </div>
  );
}

export const RuleNode = memo(RuleNodeImpl);
