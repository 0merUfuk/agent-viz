---
description: Spawn the security-reviewer agent for an OWASP + ASI audit of the current diff
argument-hint: "[optional scope — file or directory]"
allowed-tools: Read, Grep, Glob, Bash(git:*), Agent(security-reviewer)
---

# /owasp-review — OWASP + ASI Security Audit

Spawn the `security-reviewer` agent to audit the current branch's diff against OWASP Top 10:2025 and ASI01-ASI10 (Agentic Security Intelligence). Required before merging any change to:

- `app/api/fetch-repo/route.ts`
- `lib/github.ts`
- Markdown rendering paths (`MarkdownBody.tsx`, `parseAgent.ts`, `parseSkill.ts`, `parseRule.ts`)
- Environment variable handling
- Dependency updates (`package.json`, `package-lock.json`)
- Anything new under `app/api/`

## What This Skill Does

1. `git diff main...HEAD --name-only` to identify changed files
2. If any changed file is a sensitive surface (list above), proceed; otherwise warn that audit is optional
3. Spawn `security-reviewer` with the diff scope as input
4. Wait for verdict: `SECURITY_APPROVED` / `SECURITY_BLOCKED` / `SECURITY_BLOCKED -- ESCALATE`
5. Surface the verdict and findings to the manager

## Verdict Handling

- **SECURITY_APPROVED**: continue to merge step
- **SECURITY_BLOCKED**: spawn developer to fix the specific finding, then re-run `/owasp-review`
- **SECURITY_BLOCKED -- ESCALATE**: stop and surface to the user — architecture change needed
