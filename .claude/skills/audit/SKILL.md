---
description: Run a full ecosystem audit — context files, dependency hygiene, brand safety, build health
argument-hint: ""
allowed-tools: Read, Grep, Glob, Bash(npm:*), Bash(npx:*), Bash(git:*), Bash(ls:*), Bash(find:*)
---

# /audit — Ecosystem Audit

Run a comprehensive read-only audit across agent-viz. Use before starting a new feature cycle, after a major merge, or when something feels off.

## What This Skill Does

1. **Context file freshness** — checks `.claude/SERVICE_CONTEXT.md`, `.claude/NEXT_STEPS.md`, `.claude/KNOWN_ISSUES.md` for "Last Updated" drift vs. actual git activity
2. **Build health** — `npm run build` exit code and warning count
3. **Dependency hygiene** — `npm audit --omit=dev`, `npm outdated`
4. **Brand safety** — `bash scripts/check-brand.sh`
5. **Test surface** — counts unit and E2E test files; flags directories without coverage
6. **Cinema discipline** — every scenario in `components/scenarios/scripts.ts` has a verdict event; every animation has reduced-motion fallback
7. **Bundle profile** — first-load JS for `/` and `/stage`

## Output

Write the audit report to `tasks/audit/audit-YYYY-MM-DD.md` with sections:

- Health indicators table
- Stale context files (with proposed updates)
- Failing checks (with file:line references)
- Recommendations (ranked by impact)

## Constraints

- Read-only. Never modify source or context files during audit.
- Run in parallel where possible — use multiple Bash invocations in a single message for unrelated checks.
