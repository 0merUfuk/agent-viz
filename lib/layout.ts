import type { Ecosystem, Rule } from "./types";

/**
 * Radial layout. Agents form a compact grid in the centre; skills are
 * distributed evenly on a circle around them; rules sit as a strip below
 * the ring. The previous layered (top-row skills) layout is retained in
 * git history if needed.
 *
 * Sizing is computed so the ring has enough breathing room around the
 * agent cluster — the helper `handleSideTo` then lets EcosystemGraph
 * pick the side of each node that faces its peer when wiring edges.
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

const AGENT_GAP_X = 110;
const AGENT_GAP_Y = 110;
const AGENTS_PER_ROW = 5;

const SKILL_RING_PADDING = 90;
const RULE_STRIP_PADDING = 80;
const RULE_GAP = 16;

const TOP_PADDING = 60;
const SIDE_PADDING = 80;

export function layoutEcosystem(eco: Ecosystem): PositionedNode[] {
  const nodes: PositionedNode[] = [];

  // Connection counts → centrality weighting (busy nodes get earlier slots).
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

  // ── Agent cluster geometry ───────────────────────────────────────────────
  const agentRows = Math.max(1, Math.ceil(agentList.length / AGENTS_PER_ROW));
  const agentsPerRow = Math.min(agentList.length, AGENTS_PER_ROW);
  const clusterW =
    agentsPerRow * AGENT_D + Math.max(0, agentsPerRow - 1) * AGENT_GAP_X;
  const clusterH =
    agentRows * AGENT_D + Math.max(0, agentRows - 1) * AGENT_GAP_Y;

  // Cluster bounding-box half-diagonal — keeps the ring clear of corners.
  const clusterRadius = Math.sqrt(clusterW * clusterW + clusterH * clusterH) / 2;

  // Skill ring radius (centre-to-centre). Add the skill's half-diagonal so
  // skill rectangles never visually overlap the cluster.
  const skillHalfDiag = Math.sqrt(SKILL_W * SKILL_W + SKILL_H * SKILL_H) / 2;
  const ringR = clusterRadius + SKILL_RING_PADDING + skillHalfDiag;

  // ── Canvas dimensions ────────────────────────────────────────────────────
  const ringDiameter = 2 * ringR;
  const canvasWidth = Math.max(960, ringDiameter + SKILL_W + 2 * SIDE_PADDING);

  const ringTop = TOP_PADDING + SKILL_H / 2; // top edge of canvas → top skill centre
  const cx = canvasWidth / 2;
  const cy = ringTop + ringR;

  const ringBottomEdge = cy + ringR + SKILL_H / 2;
  const ruleY = ringBottomEdge + RULE_STRIP_PADDING;

  // ── Place agents in compact centred grid ─────────────────────────────────
  agentList.forEach((agent, idx) => {
    const row = Math.floor(idx / AGENTS_PER_ROW);
    const col = idx % AGENTS_PER_ROW;
    const itemsInRow =
      row < agentRows - 1
        ? AGENTS_PER_ROW
        : agentList.length - row * AGENTS_PER_ROW;
    const rowW =
      itemsInRow * AGENT_D + Math.max(0, itemsInRow - 1) * AGENT_GAP_X;
    const startX = cx - rowW / 2;
    const x = startX + col * (AGENT_D + AGENT_GAP_X);
    const y = cy - clusterH / 2 + row * (AGENT_D + AGENT_GAP_Y);
    nodes.push({
      id: agent.id,
      kind: "agent",
      x,
      y,
      width: AGENT_D,
      height: AGENT_D,
    });
  });

  // ── Place skills on the ring ─────────────────────────────────────────────
  // Distribute evenly starting at top (12 o'clock), going clockwise.
  const n = skillList.length;
  if (n > 0) {
    skillList.forEach((skill, idx) => {
      const angle = -Math.PI / 2 + (idx / n) * 2 * Math.PI;
      const sx = cx + ringR * Math.cos(angle);
      const sy = cy + ringR * Math.sin(angle);
      nodes.push({
        id: skill.id,
        kind: "skill",
        x: sx - SKILL_W / 2,
        y: sy - SKILL_H / 2,
        width: SKILL_W,
        height: SKILL_H,
      });
    });
  }

  // ── Rules below the ring, centred ────────────────────────────────────────
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

/**
 * Pick the side of a node ("t" / "r" / "b" / "l") whose handle faces the
 * given peer. Used by EcosystemGraph to route each edge through the side
 * closest to the other endpoint, instead of always top→bottom.
 */
export type HandleSide = "t" | "r" | "b" | "l";

export function handleSideTo(
  from: { x: number; y: number },
  to: { x: number; y: number },
): HandleSide {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "r" : "l";
  }
  return dy > 0 ? "b" : "t";
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
