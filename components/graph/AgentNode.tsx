"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import type { Agent } from "@/lib/types";
import { useIsActive, useRelatedHighlight } from "./EcosystemContext";

export interface AgentNodeData extends Record<string, unknown> {
  agent: Agent;
}

function modelBadgeColor(model: Agent["model"]): string {
  switch (model) {
    case "opus":    return "text-[var(--gold-bright)]";
    case "sonnet":  return "text-[var(--blue-bright)]";
    case "haiku":   return "text-[var(--text-muted)]";
    default:        return "text-[var(--text-dim)]";
  }
}

function modelLetter(model: Agent["model"]): string {
  switch (model) {
    case "opus":    return "O";
    case "sonnet":  return "S";
    case "haiku":   return "H";
    default:        return "?";
  }
}

function AgentNodeImpl({ data }: NodeProps) {
  const { agent } = data as AgentNodeData;
  const isActive = useIsActive(agent.id);
  const highlight = useRelatedHighlight(agent.id);

  const ringColor =
    agent.capability === "read-only"
      ? "var(--blue-bright)"
      : agent.capability === "mixed"
        ? "var(--blue-star)"
        : "var(--gold-bright)";

  const opacity = highlight === "faded" ? 0.2 : 1;
  const isSelected = highlight === "selected";

  return (
    <div
      className="relative flex flex-col items-center select-none"
      style={{ width: 72, opacity, transition: "opacity 180ms ease-out" }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div
        className={cn(
          "relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--abyss)]",
          "transition-[box-shadow,transform] duration-200 ease-out",
          isActive && "node-active",
        )}
        style={{
          border: `1px solid ${ringColor}`,
          boxShadow: isSelected
            ? `0 0 0 2px var(--blue-star), 0 0 32px var(--blue-glow)`
            : isActive
              ? `0 0 20px ${ringColor === "var(--gold-bright)" ? "var(--gold-glow)" : "var(--blue-glow)"}`
              : undefined,
        }}
      >
        {/* Selection lock-on ring — one-shot pulse on select */}
        {isSelected && (
          <span
            key={`lockon-${agent.id}`}
            className={cn(
              "lockon-ring rounded-full",
              ringColor === "var(--gold-bright)" && "lockon-ring--gold",
            )}
            aria-hidden
          />
        )}

        {/* Inner glow ring */}
        <div
          className="pointer-events-none absolute inset-[6px] rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at center, ${ringColor}22 0%, transparent 70%)`,
          }}
          aria-hidden
        />

        <span
          className={cn(
            "text-[22px] font-[var(--font-cinzel)] font-bold leading-none",
            modelBadgeColor(agent.model),
          )}
        >
          {modelLetter(agent.model)}
        </span>
      </div>

      <span
        className={cn(
          "mt-2 text-center text-[11px] font-medium leading-tight text-[var(--text)] max-w-[84px]",
          isSelected && "text-[var(--gold-bright)]",
        )}
      >
        {agent.name}
      </span>
    </div>
  );
}

export const AgentNode = memo(AgentNodeImpl);
