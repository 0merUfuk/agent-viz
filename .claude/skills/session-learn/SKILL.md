---
description: Capture lessons from the current session and feed them back into the ecosystem
argument-hint: ""
allowed-tools: Read, Write, Edit, Grep, Glob
---

# /session-learn — Capture Session Lessons

After a meaningful session — especially one with reviewer findings, regressions, or a surprising correction — capture what was learned and feed it back into the ecosystem so future agents inherit the lesson.

## What This Skill Does

1. **Read** `tasks/todo.md` and `tasks/session-summary.md` from the just-finished session
2. **Identify lessons** falling into three buckets:
   - **Pattern lessons** — a recurring bug shape worth encoding into a rule (e.g., "always coerce optional booleans before passing to required boolean props")
   - **Process lessons** — a workflow gap worth encoding into the manager agent's playbook (e.g., "always run brand-safety before commit")
   - **Tool lessons** — a tool capability gap worth flagging (e.g., "the parser's edge derivation misses skill-spawns-skill")
3. **Update artifacts**:
   - Pattern lessons → append to relevant `.claude/rules/*.md`
   - Process lessons → propose edits to `.claude/agents/manager.md`
   - Tool lessons → file as GitHub issue via `/issue`
4. **Append to `tasks/lessons.md`** for the next session's read-ahead

## Output

A short summary listing each lesson, its bucket, and where it landed.

## Constraints

- One pass per session — don't re-run mid-work
- Prefer adding to existing rules over creating new ones (rule sprawl is worse than longer rules)
- If a lesson contradicts an existing rule, surface to the user before changing the rule
