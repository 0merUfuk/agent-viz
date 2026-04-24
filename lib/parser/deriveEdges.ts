import type { Agent, Edge, Skill } from "../types";

export function deriveEdges(agents: Agent[], skills: Skill[]): Edge[] {
  const agentIds = new Set(agents.map((a) => a.id));
  const edges: Edge[] = [];

  for (const skill of skills) {
    for (const target of skill.spawnsAgents) {
      if (!agentIds.has(target)) continue;
      edges.push({
        id: `sa:${skill.id}->${target}`,
        source: skill.id,
        target,
        kind: "skill-spawns-agent",
      });
    }
  }

  for (const agent of agents) {
    for (const target of agent.spawnTargets) {
      if (!agentIds.has(target)) continue;
      if (target === agent.id) continue;
      edges.push({
        id: `aa:${agent.id}->${target}`,
        source: agent.id,
        target,
        kind: "agent-spawns-agent",
      });
    }
  }

  return edges;
}
