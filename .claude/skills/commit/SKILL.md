---
description: Create a well-formed conventional commit on the current feature branch
argument-hint: "[optional commit message override]"
allowed-tools: Read, Grep, Glob, Bash(git:*), Bash(npm:*)
---

# /commit — Create Commit

Stage the current working tree, draft a conventional-commit message that explains *why* not *what*, run pre-commit checks, and create the commit on the current feature branch.

## What This Skill Does

1. Confirm not on `main` — refuse if on `main`
2. `git status` and `git diff` to understand scope
3. `git log --oneline -10` to match repo style
4. `npm run build` — must pass
5. `bash scripts/check-brand.sh` — must pass
6. Draft a commit message:
   - Header: `<type>(<scope>): <subject>` — ≤ 72 chars
   - Body: 2-4 paragraphs explaining motivation, key decisions, follow-ups
7. Stage relevant files (avoid `.env*`, build artifacts, large binaries)
8. Commit with HEREDOC for clean formatting
9. `git status` to verify

## Conventional Types

- `feat` — new feature, new scenario, new overlay
- `fix` — bug fix
- `refactor` — restructure without behavior change
- `docs` — DESIGN.md, README, comments
- `test` — test-only changes
- `chore` — build, deps, config

## Constraints

- Never `git push` — that's `/release` or the manager's PR step
- Never amend — always new commit
- Never use `-i`, `--no-verify`, or `--no-edit`
