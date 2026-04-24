---
description: Triage and remediate findings from a recent /audit or /doublecheck run
argument-hint: "<audit-report-path>"
allowed-tools: Read, Grep, Glob, Bash, Agent(developer, tester, reviewer)
---

# /fix — Remediate Audit Findings

Take a finished audit or doublecheck report and drive its findings to closure. Spawns developer for fixes, tester for regression coverage, reviewer for the quality gate.

## What This Skill Does

1. Read the report at the supplied path
2. Triage findings:
   - **CRITICAL** — must fix before anything else ships
   - **WARNING** — fix this cycle if time permits
   - **MINOR** — file as a follow-up, do not block
3. For each CRITICAL: spawn `developer` with the specific finding, file:line, and acceptance criteria
4. After developer reports back: spawn `tester` to add regression coverage
5. After tester reports back: spawn `reviewer` for the quality gate
6. Loop until all CRITICAL items are APPROVED
7. Update the original report with `[FIXED]` markers and the resolving commit SHA

## Constraints

- Never spawn agents in parallel for fixes that touch the same file (worktree conflicts)
- Always re-run `npm run build` and `bash scripts/check-brand.sh` after any fix lands on the branch
- If a fix would require an architecture change, escalate to the user before spawning developer
