---
description: Scan the working tree for accidentally-committed secrets before push
argument-hint: ""
allowed-tools: Read, Grep, Glob, Bash(git:*), Bash(grep:*)
---

# /secret-scan — Secret Scan

Scan staged and recent changes for accidentally-committed credentials. Run before every `git push`.

## What This Skill Does

Walk these patterns across staged files and the last 10 commits:

- `ghp_[A-Za-z0-9]{36,}` — GitHub classic PAT
- `github_pat_[A-Za-z0-9_]{82,}` — GitHub fine-grained PAT
- `sk-[A-Za-z0-9]{32,}` — OpenAI / Anthropic-style API keys
- `xoxb-`, `xoxp-`, `xoxa-` — Slack tokens
- `AKIA[0-9A-Z]{16}` — AWS access key id
- `-----BEGIN .* PRIVATE KEY-----` — PEM-encoded private keys
- `password\s*[:=]\s*["'][^"']{6,}["']` — hardcoded passwords (heuristic)

## Scope

```
git diff --cached --name-only            # staged
git log -10 --name-only --pretty=format: # recent
```

## Output

If anything matches:

```
🚨 SECRET DETECTED
  pattern:  <regex>
  file:     <path>
  line:     <n>
  recent:   <"staged" | "<commit-sha>">

ACTION:
  1. Remove the secret
  2. If already pushed: rotate the credential immediately
  3. Consider `git filter-repo` if the leak is in repo history
```

## Constraints

- Read-only — never modify files
- Treat `.env.local.example` as documentation; the literal string `GITHUB_TOKEN=` (empty value) is allowed
