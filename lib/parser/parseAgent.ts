import matter from "gray-matter";
import type { Agent, Capability, Model } from "../types";

const READONLY_MARKERS = ["Write", "Edit", "NotebookEdit"];

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    // Split on newlines, then on commas not inside parentheses, so that
    // multi-arg `Agent(a, b, c)` survives the split as one token instead of
    // being torn into `Agent(a` / `b` / `c)` fragments. Mirrors parseSkill.ts.
    return v
      .split(/\n/)
      .flatMap((line) => line.split(/,(?![^(]*\))/))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeModel(raw: unknown): Model {
  if (typeof raw !== "string") return "unknown";
  const v = raw.toLowerCase().trim();
  if (v.includes("opus")) return "opus";
  if (v.includes("sonnet")) return "sonnet";
  if (v.includes("haiku")) return "haiku";
  return "unknown";
}

function deriveCapability(tools: string[], disallowedTools: string[]): Capability {
  const writeTools = new Set(READONLY_MARKERS);
  const disallowsWrite = disallowedTools.some((t) => writeTools.has(t));
  const allowsWrite = tools.some((t) => writeTools.has(t));
  if (disallowsWrite && !allowsWrite) return "read-only";
  if (disallowsWrite && allowsWrite) return "mixed";
  if (allowsWrite) return "write";
  // No explicit mention — if any write tool is implied by Edit/Write/Notebook in body, guess write.
  return "write";
}

function extractSpawnTargets(body: string): string[] {
  const targets = new Set<string>();
  // subagent_type: "name" or 'name'
  const subagentRe = /subagent_type:\s*['"]([a-z][a-z0-9-]*)['"]/gi;
  for (const m of body.matchAll(subagentRe)) {
    targets.add(m[1]);
  }
  // Agent("name"), Agent('name') — loose grammar
  const agentCallRe = /Agent\(\s*['"]([a-z][a-z0-9-]*)['"]/g;
  for (const m of body.matchAll(agentCallRe)) {
    targets.add(m[1]);
  }
  return Array.from(targets);
}

export interface ParseAgentInput {
  id: string;
  raw: string;
}

export function parseAgent({ id, raw }: ParseAgentInput): Agent {
  const { data, content } = matter(raw);

  const tools = toArray(data.tools);
  const disallowedTools = toArray(
    data.disallowedTools ?? data["disallowed-tools"] ?? data.disallowed_tools,
  );
  const capability = deriveCapability(tools, disallowedTools);
  const spawnTargets = extractSpawnTargets(content);
  const canSpawnAgents =
    tools.some((t) => t === "Agent" || t.startsWith("Agent(")) ||
    /subagent_type/i.test(content) ||
    spawnTargets.length > 0;

  return {
    id,
    name: typeof data.name === "string" ? data.name : id,
    description:
      typeof data.description === "string"
        ? data.description.trim()
        : "",
    model: normalizeModel(data.model),
    tools,
    disallowedTools,
    maxTurns:
      typeof data.maxTurns === "number"
        ? data.maxTurns
        : typeof data.maxTurns === "string"
          ? Number(data.maxTurns) || undefined
          : undefined,
    isolation: data.isolation === "worktree" ? "worktree" : undefined,
    memory: data.memory === "project" ? "project" : undefined,
    permissionMode:
      typeof data.permissionMode === "string" ? data.permissionMode : undefined,
    capability,
    canSpawnAgents,
    spawnTargets,
    promptBody: content.trim(),
  };
}
