/**
 * Ecosystem data model.
 * See PLAN.md §6 for derivation rules.
 */

export type Model = "opus" | "sonnet" | "haiku" | "unknown";

export type Capability = "read-only" | "write" | "mixed";

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: Model;
  tools: string[];
  disallowedTools: string[];
  maxTurns?: number;
  isolation?: "worktree";
  memory?: "project";
  permissionMode?: string;
  capability: Capability;
  canSpawnAgents: boolean;
  spawnTargets: string[];
  promptBody: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  argumentHint: string;
  allowedTools: string[];
  spawnsAgents: string[];
  body: string;
}

export interface Rule {
  id: string;
  name: string;
  scope: string;
  body: string;
}

export type EdgeKind =
  | "skill-spawns-agent"
  | "agent-spawns-agent"
  | "agent-uses-rule";

export interface Edge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
}

export interface Ecosystem {
  agents: Agent[];
  skills: Skill[];
  rules: Rule[];
  edges: Edge[];
  meta: {
    sourceLabel: string;
    generatedAt: string;
  };
}

/**
 * Input format for the parser. Each file is addressed by its path within
 * the `.claude/` directory — e.g. `agents/reviewer.md`, `skills/audit/SKILL.md`,
 * `rules/conventions.md`.
 */
export type FileMap = Record<string, string>;
