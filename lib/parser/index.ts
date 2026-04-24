import type { Ecosystem, FileMap } from "../types";
import { parseAgent } from "./parseAgent";
import { parseSkill } from "./parseSkill";
import { parseRule } from "./parseRule";
import { deriveEdges } from "./deriveEdges";

/**
 * Build an Ecosystem from a flat map of `.claude/` file paths → contents.
 * Paths are normalized relative to the `.claude/` root.
 *
 * Agents: `agents/<id>.md`
 * Skills: `skills/<id>/SKILL.md` (or `skills/<id>.md`)
 * Rules:  `rules/<id>.md`
 */
export function buildEcosystem(files: FileMap, sourceLabel: string): Ecosystem {
  const agentFiles: Array<[string, string]> = [];
  const skillFiles: Array<[string, string]> = [];
  const ruleFiles: Array<[string, string]> = [];

  for (const [path, content] of Object.entries(files)) {
    const p = path.replace(/^\.?\/?\.claude\//, "").replace(/^\/+/, "");
    if (p.startsWith("agents/") && p.endsWith(".md")) {
      const id = p
        .replace(/^agents\//, "")
        .replace(/\.md$/, "")
        .split("/")[0];
      if (id) agentFiles.push([id, content]);
    } else if (p.startsWith("skills/")) {
      const parts = p.replace(/^skills\//, "").split("/");
      const id = parts[0];
      const leaf = parts[parts.length - 1];
      // Only take SKILL.md (or direct .md when it's a single-file skill)
      if (leaf?.toLowerCase() === "skill.md" || (parts.length === 1 && leaf.endsWith(".md"))) {
        const finalId = leaf.toLowerCase() === "skill.md" ? id : id.replace(/\.md$/, "");
        if (finalId) skillFiles.push([finalId, content]);
      }
    } else if (p.startsWith("rules/") && p.endsWith(".md")) {
      const id = p.replace(/^rules\//, "").replace(/\.md$/, "");
      if (id) ruleFiles.push([id, content]);
    }
  }

  const agents = agentFiles.map(([id, raw]) => parseAgent({ id, raw }));
  const knownAgents = new Set(agents.map((a) => a.id));
  const skills = skillFiles.map(([id, raw]) => parseSkill({ id, raw, knownAgents }));
  const rules = ruleFiles.map(([id, raw]) => parseRule({ id, raw }));
  const edges = deriveEdges(agents, skills);

  return {
    agents,
    skills,
    rules,
    edges,
    meta: {
      sourceLabel,
      generatedAt: new Date().toISOString(),
    },
  };
}
