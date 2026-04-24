---
description: Run adversarial edge-case checks on a recent change before marking it done
argument-hint: "<file-or-feature-name>"
allowed-tools: Read, Grep, Glob, Bash(npm:*), Bash(npx:*), Agent(reviewer)
---

# /doublecheck — Adversarial Verification

Run before declaring "done" on any non-trivial change. Spawns adversarial passes targeting the categories of bug that actually escape into the demo.

## What This Skill Does

For the named file or feature, walk these probes:

1. **Reduced-motion** — does every animation collapse correctly under `prefers-reduced-motion`? Test by toggling DevTools `Emulate CSS media feature`
2. **Cross-tab consistency** — open `/` and `/stage` in two windows; confirm state matches at every step
3. **Late-joining tab** — open `/stage`, start a scenario, then open `/`; does it catch up via hello-handshake?
4. **Scenario boundary** — does the verdict banner dismiss before the next scenario can start? does running the same scenario twice in a row reset cleanly?
5. **Empty / malformed input** — load a public repo with no `.claude/` (e.g., `vercel/next.js`); does the error message guide the user?
6. **Keyboard reachability** — every interactive element focusable; focus ring visible against the void background
7. **Brand safety** — `bash scripts/check-brand.sh` clean

## Spawn the doublecheck Subagent

```
Agent("doublecheck", { task: "<scope>", probes: [<list>] })
```

The subagent reports findings as `✓` / `✗` per probe, with file:line for any `✗`.

## Output

Append findings to the active session's `tasks/todo.md` under "Doublecheck — <feature>". The manager decides whether any `✗` blocks completion.
