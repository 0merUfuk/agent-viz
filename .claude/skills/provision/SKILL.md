---
description: Create or evolve a `.claude/` ecosystem artifact (agent, skill, or rule) from a spec
argument-hint: "<artifact-type> <name> [-- <one-line spec>]"
allowed-tools: Read, Write, Edit, Grep, Glob
---

# /provision — Provision Ecosystem Artifact

Create a new agent, skill, or rule with all required frontmatter, conventional structure, and a stub body. Used by the `architect` agent and by the user when adding to the ecosystem manually.

## Usage

```
/provision agent <name> -- <one-line role description>
/provision skill <name> -- <one-line capability description>
/provision rule <name> -- <one-line scope description>
```

## What This Skill Does

### Agent

Writes `.claude/agents/<name>.md` with:
- Standard frontmatter (name, description, tools, model, maxTurns, optional memory/isolation/permissionMode)
- "What You Do" section
- "How You Work" section
- "Constraints" section
- If read-only: includes `disallowedTools: Write, Edit, NotebookEdit`
- If code-writing: includes `isolation: worktree`

### Skill

Creates `.claude/skills/<name>/SKILL.md` with:
- Frontmatter (description, argument-hint, allowed-tools)
- `# /<name> — <Title>` heading (em-dash, never `--`)
- "What This Skill Does" enumerated steps
- "Constraints" section

### Rule

Writes `.claude/rules/<name>.md` with:
- Standard documentation frontmatter (Version, Created, Last Updated, Authors)
- First body line: `> Auto-loaded when ...` documenting the trigger scope
- Concise body (target < 200 lines — rules load into every context)

## Validation

After provisioning, the skill verifies:
- Filename matches `name` field in frontmatter
- All required frontmatter fields present
- Read-only and code-writing flags are mutually exclusive on agents
- If `memory: project` is declared, `.claude/agent-memory/<name>/` exists with a `MEMORY.md` index
