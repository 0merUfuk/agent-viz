"use client";

import { Sheet } from "@/components/ui/Sheet";
import type { Ecosystem } from "@/lib/types";
import { AgentDetail } from "./AgentDetail";
import { SkillDetail } from "./SkillDetail";
import { RuleDetail } from "./RuleDetail";

export interface DetailPanelProps {
  ecosystem: Ecosystem | null;
  selectedId: string | null;
  onClose: () => void;
}

export function DetailPanel({ ecosystem, selectedId, onClose }: DetailPanelProps) {
  if (!ecosystem || !selectedId) {
    return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  }

  const agent = ecosystem.agents.find((a) => a.id === selectedId);
  if (agent) {
    return (
      <Sheet open title="Agent" onClose={onClose}>
        <AgentDetail agent={agent} />
      </Sheet>
    );
  }

  const skill = ecosystem.skills.find((s) => s.id === selectedId);
  if (skill) {
    return (
      <Sheet open title="Skill" onClose={onClose}>
        <SkillDetail skill={skill} />
      </Sheet>
    );
  }

  const rule = ecosystem.rules.find((r) => r.id === selectedId);
  if (rule) {
    return (
      <Sheet open title="Rule" onClose={onClose}>
        <RuleDetail rule={rule} />
      </Sheet>
    );
  }

  return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
}
