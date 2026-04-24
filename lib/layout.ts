import type { Agent, Ecosystem, Rule } from "./types";

/**
 * Layered layout. Skills top row, agents middle (1 row ≤ 8, else 2 rows),
 * rules as a bottom strip. X distribution weights agents by their inbound
 * connection count to cluster the busy ones centrally.
 */

export interface PositionedNode {
  id: string;
  kind: "agent" | "skill" | "rule";
  x: number;
  y: number;
  width: number;
  height: number;
}

const SKILL_W = 180;
const SKILL_H = 44;
const AGENT_D = 72;
const RULE_W = 140;
const RULE_H = 28;

const SKILL_GAP = 28;
const AGENT_GAP_X = 140;
const AGENT_GAP_Y = 160;
const RULE_GAP = 16;

const SKILL_ROW_Y = 40;

export function layoutEcosystem(eco: Ecosystem): PositionedNode[] {
  const nodes: PositionedNode[] = [];

  // Count connections to sort agents by centrality (more connections → center).
  const inbound = new Map<string, number>();
  for (const e of eco.edges) {
    inbound.set(e.target, (inbound.get(e.target) ?? 0) + 1);
    inbound.set(e.source, (inbound.get(e.source) ?? 0) + 1);
  }

  const agentList = [...eco.agents].sort(
    (a, b) => (inbound.get(b.id) ?? 0) - (inbound.get(a.id) ?? 0),
  );

  const skillList = [...eco.skills].sort(
    (a, b) => (inbound.get(b.id) ?? 0) - (inbound.get(a.id) ?? 0),
  );

  // Compute total canvas width from the widest row.
  const skillRowWidth =
    skillList.length * SKILL_W + Math.max(0, skillList.length - 1) * SKILL_GAP;
  const agentRows = agentList.length > 8 ? 2 : 1;
  const agentsPerRow = Math.ceil(agentList.length / agentRows);
  const agentRowWidth =
    agentsPerRow * AGENT_D + Math.max(0, agentsPerRow - 1) * AGENT_GAP_X;
  const ruleRowWidth =
    eco.rules.length * RULE_W + Math.max(0, eco.rules.length - 1) * RULE_GAP;

  const canvasWidth = Math.max(skillRowWidth, agentRowWidth, ruleRowWidth, 960);

  // Skill row — centrality-ordered bell: higher centrality closer to center.
  placeCentered(
    skillList.map((s) => s.id),
    SKILL_W,
    SKILL_GAP,
    SKILL_ROW_Y,
    canvasWidth,
  ).forEach(([id, x, y]) => {
    nodes.push({ id, kind: "skill", x, y, width: SKILL_W, height: SKILL_H });
  });

  // Agents rows
  const agentTopY = SKILL_ROW_Y + SKILL_H + 120;
  const rowSplits: Agent[][] = [];
  if (agentRows === 1) {
    rowSplits.push(agentList);
  } else {
    // Interleave so the center of each row is the most-connected pair.
    const half = Math.ceil(agentList.length / 2);
    rowSplits.push(agentList.slice(0, half));
    rowSplits.push(agentList.slice(half));
  }

  rowSplits.forEach((row, rowIdx) => {
    placeCentered(
      row.map((a) => a.id),
      AGENT_D,
      AGENT_GAP_X,
      agentTopY + rowIdx * AGENT_GAP_Y,
      canvasWidth,
    ).forEach(([id, x, y]) => {
      nodes.push({ id, kind: "agent", x, y, width: AGENT_D, height: AGENT_D });
    });
  });

  // Rule strip at the bottom
  const ruleY =
    agentTopY + agentRows * AGENT_GAP_Y + 40;
  placeCentered(
    eco.rules.map((r: Rule) => r.id),
    RULE_W,
    RULE_GAP,
    ruleY,
    canvasWidth,
  ).forEach(([id, x, y]) => {
    nodes.push({ id, kind: "rule", x, y, width: RULE_W, height: RULE_H });
  });

  return nodes;
}

export function nodeCenter(n: PositionedNode): { x: number; y: number } {
  return { x: n.x + n.width / 2, y: n.y + n.height / 2 };
}

function placeCentered(
  ids: string[],
  itemWidth: number,
  gap: number,
  y: number,
  canvasWidth: number,
): Array<[string, number, number]> {
  const n = ids.length;
  if (n === 0) return [];
  const totalW = n * itemWidth + (n - 1) * gap;
  const startX = (canvasWidth - totalW) / 2;
  return ids.map((id, i) => {
    const x = startX + i * (itemWidth + gap);
    return [id, x, y];
  });
}

