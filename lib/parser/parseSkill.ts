import matter from "gray-matter";
import type { Skill } from "../types";

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    return v
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function agentsFromAllowedTools(allowedTools: string[]): string[] {
  const out: string[] = [];
  for (const t of allowedTools) {
    // Agent(name) or Agent(name1, name2)
    const m = t.match(/^Agent\(([^)]*)\)$/i);
    if (m) {
      const names = m[1]
        .split(",")
        .map((n) => n.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      for (const n of names) out.push(n);
    }
  }
  return out;
}

function agentsFromBody(body: string, knownAgents: Set<string>): string[] {
  const found = new Set<string>();
  // Agent("name") / Agent('name')
  const agentCallRe = /Agent\(\s*['"]([a-z][a-z0-9-]*)['"]/g;
  for (const m of body.matchAll(agentCallRe)) {
    if (knownAgents.has(m[1])) found.add(m[1]);
  }
  // subagent_type: "name"
  const subagentRe = /subagent_type:\s*['"]([a-z][a-z0-9-]*)['"]/gi;
  for (const m of body.matchAll(subagentRe)) {
    if (knownAgents.has(m[1])) found.add(m[1]);
  }
  return Array.from(found);
}

export interface ParseSkillInput {
  id: string;
  raw: string;
  knownAgents: Set<string>;
}

export function parseSkill({ id, raw, knownAgents }: ParseSkillInput): Skill {
  const { data, content } = matter(raw);

  const allowedTools = toArray(data["allowed-tools"] ?? data.allowedTools);
  const spawnsFromTools = agentsFromAllowedTools(allowedTools);
  const spawnsFromBody = agentsFromBody(content, knownAgents);
  const spawnsAgents = Array.from(new Set([...spawnsFromTools, ...spawnsFromBody]));

  return {
    id,
    name: typeof data.name === "string" ? data.name : id,
    description:
      typeof data.description === "string" ? data.description.trim() : "",
    argumentHint:
      typeof data["argument-hint"] === "string"
        ? data["argument-hint"]
        : typeof data.argumentHint === "string"
          ? data.argumentHint
          : "",
    allowedTools,
    spawnsAgents,
    body: content.trim(),
  };
}
