#!/usr/bin/env node
/**
 * Bakes the current repo's `.claude/` directory into a static ecosystem JSON
 * at `public/default-ecosystem.json`. Run this whenever `.claude/` changes
 * meaningfully and you want the audience cinema's cold-mount to reflect it.
 *
 * Mirrors the parsing logic in `lib/parser/` so the output matches what
 * `buildEcosystem` would produce at runtime. Implemented in plain Node so it
 * can run without tsx or any build pipeline.
 *
 * Usage:
 *   node scripts/build-default-ecosystem.mjs
 */

import { readFileSync, readdirSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CLAUDE_DIR = join(REPO_ROOT, ".claude");
const OUTPUT_PATH = join(REPO_ROOT, "public", "default-ecosystem.json");

const SOURCE_LABEL = "SedatSencan/age-of-ai";

const READONLY_MARKERS = ["Write", "Edit", "NotebookEdit"];

function toArray(v) {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    // Split on newlines, then on commas not inside parentheses, so that
    // multi-arg `Agent(a, b, c)` survives the split as one token instead of
    // being torn into `Agent(a` / `b` / `c)` fragments.
    return v
      .split(/\n/)
      .flatMap((line) => line.split(/,(?![^(]*\))/))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeModel(raw) {
  if (typeof raw !== "string") return "unknown";
  const v = raw.toLowerCase().trim();
  if (v.includes("opus")) return "opus";
  if (v.includes("sonnet")) return "sonnet";
  if (v.includes("haiku")) return "haiku";
  return "unknown";
}

function deriveCapability(tools, disallowedTools) {
  const writeTools = new Set(READONLY_MARKERS);
  const disallowsWrite = disallowedTools.some((t) => writeTools.has(t));
  const allowsWrite = tools.some((t) => writeTools.has(t));
  if (disallowsWrite && !allowsWrite) return "read-only";
  if (disallowsWrite && allowsWrite) return "mixed";
  if (allowsWrite) return "write";
  return "write";
}

function extractSpawnTargetsFromBody(body) {
  const targets = new Set();
  const subagentRe = /subagent_type:\s*['"]([a-z][a-z0-9-]*)['"]/gi;
  for (const m of body.matchAll(subagentRe)) targets.add(m[1]);
  const agentCallRe = /Agent\(\s*['"]([a-z][a-z0-9-]*)['"]/g;
  for (const m of body.matchAll(agentCallRe)) targets.add(m[1]);
  return Array.from(targets);
}

function parseAgent(id, raw) {
  const { data, content } = matter(raw);
  const tools = toArray(data.tools);
  const disallowedTools = toArray(
    data.disallowedTools ?? data["disallowed-tools"] ?? data.disallowed_tools,
  );
  const capability = deriveCapability(tools, disallowedTools);
  const spawnTargets = extractSpawnTargetsFromBody(content);
  const canSpawnAgents =
    tools.some((t) => t === "Agent" || t.startsWith("Agent(")) ||
    /subagent_type/i.test(content) ||
    spawnTargets.length > 0;

  let maxTurns;
  if (typeof data.maxTurns === "number") maxTurns = data.maxTurns;
  else if (typeof data.maxTurns === "string") {
    const n = Number(data.maxTurns);
    if (!Number.isNaN(n)) maxTurns = n;
  }

  const agent = {
    id,
    name: typeof data.name === "string" ? data.name : id,
    description: typeof data.description === "string" ? data.description.trim() : "",
    model: normalizeModel(data.model),
    tools,
    disallowedTools,
    capability,
    canSpawnAgents,
    spawnTargets,
    promptBody: content.trim(),
  };
  if (maxTurns !== undefined) agent.maxTurns = maxTurns;
  if (data.isolation === "worktree") agent.isolation = "worktree";
  if (data.memory === "project") agent.memory = "project";
  if (typeof data.permissionMode === "string") agent.permissionMode = data.permissionMode;
  return agent;
}

function agentsFromAllowedTools(allowedTools) {
  const out = [];
  for (const t of allowedTools) {
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

function agentsFromBody(body, knownAgents) {
  const found = new Set();
  const agentCallRe = /Agent\(\s*['"]([a-z][a-z0-9-]*)['"]/g;
  for (const m of body.matchAll(agentCallRe)) {
    if (knownAgents.has(m[1])) found.add(m[1]);
  }
  const subagentRe = /subagent_type:\s*['"]([a-z][a-z0-9-]*)['"]/gi;
  for (const m of body.matchAll(subagentRe)) {
    if (knownAgents.has(m[1])) found.add(m[1]);
  }
  return Array.from(found);
}

function parseSkill(id, raw, knownAgents) {
  const { data, content } = matter(raw);
  const allowedTools = toArray(data["allowed-tools"] ?? data.allowedTools);
  const spawnsFromTools = agentsFromAllowedTools(allowedTools);
  const spawnsFromBody = agentsFromBody(content, knownAgents);
  const spawnsAgents = Array.from(new Set([...spawnsFromTools, ...spawnsFromBody]));

  const argumentHint =
    typeof data["argument-hint"] === "string"
      ? data["argument-hint"]
      : typeof data.argumentHint === "string"
        ? data.argumentHint
        : "";

  return {
    id,
    name: typeof data.name === "string" ? data.name : id,
    description: typeof data.description === "string" ? data.description.trim() : "",
    argumentHint,
    allowedTools,
    spawnsAgents,
    body: content.trim(),
  };
}

function parseRule(id, raw) {
  const { data, content } = matter(raw);
  const name = typeof data.name === "string" ? data.name : id;
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  let scope = "";
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("---")) continue;
    if (line.startsWith(">")) {
      scope = line.replace(/^>\s*/, "").replace(/^\*\*Auto-loaded\*\*/, "Auto-loaded");
      break;
    }
    scope = line;
    break;
  }
  return { id, name, scope, body: content.trim() };
}

function deriveEdges(agents, skills) {
  const agentIds = new Set(agents.map((a) => a.id));
  const edges = [];
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

function readAgents() {
  const dir = join(CLAUDE_DIR, "agents");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files.map((f) => ({
    id: f.replace(/\.md$/, ""),
    raw: readFileSync(join(dir, f), "utf8"),
  }));
}

function readSkills() {
  const dir = join(CLAUDE_DIR, "skills");
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const entryPath = join(dir, entry);
    const st = statSync(entryPath);
    if (st.isDirectory()) {
      const skillFile = join(entryPath, "SKILL.md");
      if (existsSync(skillFile)) {
        out.push({ id: entry, raw: readFileSync(skillFile, "utf8") });
      }
    } else if (entry.endsWith(".md")) {
      out.push({ id: entry.replace(/\.md$/, ""), raw: readFileSync(entryPath, "utf8") });
    }
  }
  return out;
}

function readRules() {
  const dir = join(CLAUDE_DIR, "rules");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files.map((f) => ({
    id: f.replace(/\.md$/, ""),
    raw: readFileSync(join(dir, f), "utf8"),
  }));
}

function main() {
  if (!existsSync(CLAUDE_DIR)) {
    console.error(`No .claude/ directory at ${CLAUDE_DIR}`);
    process.exit(1);
  }

  const agentInputs = readAgents();
  const skillInputs = readSkills();
  const ruleInputs = readRules();

  const agents = agentInputs.map(({ id, raw }) => parseAgent(id, raw));
  const knownAgents = new Set(agents.map((a) => a.id));
  const skills = skillInputs.map(({ id, raw }) => parseSkill(id, raw, knownAgents));
  const rules = ruleInputs.map(({ id, raw }) => parseRule(id, raw));
  const edges = deriveEdges(agents, skills);

  const ecosystem = {
    agents,
    skills,
    rules,
    edges,
    meta: {
      sourceLabel: SOURCE_LABEL,
      generatedAt: new Date().toISOString(),
    },
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(ecosystem, null, 2) + "\n", "utf8");

  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`  agents: ${agents.length}`);
  console.log(`  skills: ${skills.length}`);
  console.log(`  rules:  ${rules.length}`);
  console.log(`  edges:  ${edges.length}`);
}

main();
