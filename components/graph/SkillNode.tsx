"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import type { Skill } from "@/lib/types";
import { useIsActive, useRelatedHighlight } from "./EcosystemContext";

export interface SkillNodeData extends Record<string, unknown> {
  skill: Skill;
}

function SkillNodeImpl({ data }: NodeProps) {
  const { skill } = data as SkillNodeData;
  const isActive = useIsActive(skill.id);
  const highlight = useRelatedHighlight(skill.id);

  const isOrchestrator = skill.spawnsAgents.length > 0;
  const isSelected = highlight === "selected";
  const opacity = highlight === "faded" ? 0.2 : 1;

  return (
    <div
      className={cn(
        "relative flex h-[44px] w-[180px] select-none items-center gap-2 bg-[var(--abyss)]",
        "transition-[opacity,box-shadow] duration-200 ease-out",
        isActive && "node-active",
      )}
      style={{
        opacity,
        border: `1px solid ${isSelected ? "var(--blue-bright)" : "var(--border-subtle)"}`,
        boxShadow: isSelected
          ? "0 0 0 2px var(--blue-star), 0 0 24px var(--blue-glow)"
          : isActive
            ? "0 0 16px var(--blue-glow)"
            : undefined,
      }}
    >
      {/* Four-sided handle set — EcosystemGraph picks the side that faces
          the connected node, so radial connections route cleanly. */}
      <Handle id="t-tgt" type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle id="t-src" type="source" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle id="r-tgt" type="target" position={Position.Right}  style={{ opacity: 0 }} />
      <Handle id="r-src" type="source" position={Position.Right}  style={{ opacity: 0 }} />
      <Handle id="b-tgt" type="target" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle id="b-src" type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle id="l-tgt" type="target" position={Position.Left}   style={{ opacity: 0 }} />
      <Handle id="l-src" type="source" position={Position.Left}   style={{ opacity: 0 }} />

      {/* Selection lock-on ring — one-shot pulse on select */}
      {isSelected && (
        <span
          key={`lockon-${skill.id}`}
          className="lockon-ring"
          aria-hidden
        />
      )}

      {/* Left accent bar */}
      <div
        className="h-full w-[3px] shrink-0"
        style={{
          background: isOrchestrator ? "var(--gold)" : "var(--blue)",
        }}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center pr-3">
        <span
          className={cn(
            "block truncate text-[13px] leading-tight font-[var(--font-mono)]",
            "text-[var(--blue-bright)]",
          )}
        >
          /{skill.name}
        </span>
        {skill.description && (
          <span className="block truncate text-[10px] leading-tight text-[var(--text-muted)]">
            {skill.description}
          </span>
        )}
      </div>
    </div>
  );
}

export const SkillNode = memo(SkillNodeImpl);
