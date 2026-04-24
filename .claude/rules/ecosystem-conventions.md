**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# Ecosystem Conventions — agent-viz

> Auto-loaded for all work in agent-viz. Apply these rules whenever creating or editing agent, skill, or rule files — whether via `/provision` or by hand.

---

## Agent Files (`.claude/agents/*.md`)

### Required YAML Frontmatter

| Field | Description |
|-------|-------------|
| `name` | Matches the filename without `.md` |
| `description` | One-line summary, used for agent selection |
| `tools` | Explicit list; no wildcards except `Bash(prefix:*)` |
| `model` | `opus` for complex reasoning, `sonnet` for focused tasks |
| `maxTurns` | Code-writing agents: 60–100; review/research agents: 30–60 |
| `memory: project` | If the agent should accumulate cross-session learning |
| `permissionMode` | Usually `bypassPermissions` for autonomous agents |

### Behavioral Rules

- Read-only agents MUST have `disallowedTools: Write, Edit, NotebookEdit`
- Code-writing agents SHOULD have `isolation: worktree`
- Read-only and code-writing are mutually exclusive — never both on one agent
- If `memory: project` is set, the directory `.claude/agent-memory/{name}/` MUST exist
- The cinema parser keys agent capability off `disallowedTools` — keep that field accurate or the visualization will misclassify the agent

---

## Skill Files (`.claude/skills/<name>/SKILL.md`)

### Required YAML Frontmatter

| Field | Description |
|-------|-------------|
| `description` | One-line summary of what the skill does |
| `argument-hint` | What arguments the skill accepts; use `""` if none — always include |
| `allowed-tools` | Explicit tool list; include `Agent(name1, name2)` if the skill spawns subagents |

### Heading Format

```markdown
# /{name} — {Title}
```

Use em-dash (`—`), not double-hyphen. The parser uses the first H1 to extract the skill title.

### Body Structure

- `## What This Skill Does` — numbered pipeline of steps
- `## When To Run` — triggers
- `## Constraints` — what NOT to do, branch requirements, gates

---

## Rule Files (`.claude/rules/*.md`)

- Required standard frontmatter: Version, Created, Last Updated, Authors
- First line of body: `> Auto-loaded when...` documenting the trigger scope
- New rules should aim for under 200 lines — rules load into every context window
- All `.claude/rules/` files are auto-loaded for all work in this repo. The `> Auto-loaded when...` opener is informational, not a filter

---

## Memory Directories

- If an agent has `memory: project`, its directory must exist at `.claude/agent-memory/{name}/`
- Directory contents are gitignored except a `MEMORY.md` index seed
- Starter `MEMORY.md`: `# Memory Index` header and a one-line placeholder

---

## Self-Referential Demo Contract

agent-viz is meant to load **itself** in the cinema demo. That gives this `.claude/` ecosystem two readers:

1. The `lib/parser/` modules — parse frontmatter, derive edges, render in the graph
2. Claude Code at runtime — actually executes the agents and skills

Both contracts must hold. Never write a rule, agent, or skill that **only** the parser can interpret or **only** Claude can execute. If you change the frontmatter shape, run `npm run build` and load `0merUfuk/agent-viz` in `/stage` to verify the cinema graph still renders correctly.
