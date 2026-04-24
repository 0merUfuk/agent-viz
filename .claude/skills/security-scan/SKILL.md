---
description: Run a focused security scan on the current diff — npm audit, code patterns, env hygiene
argument-hint: ""
allowed-tools: Read, Grep, Glob, Bash(npm:*), Bash(git:*)
---

# /security-scan — Code-Pattern Security Scan

Lighter than `/owasp-review`. Runs deterministic checks the manager invokes after every dev commit on a sensitive surface, without spawning the full security-reviewer agent.

## What This Skill Does

1. **Dependency audit**:
   ```bash
   npm audit --omit=dev --audit-level=moderate
   ```
2. **Dangerous code patterns**:
   ```bash
   grep -rn "dangerouslySetInnerHTML\|eval(\|Function(\|new Function" app/ components/ lib/
   grep -rn "child_process\|execSync\|spawn(" app/ components/ lib/
   ```
3. **Env hygiene**:
   ```bash
   git diff --cached -- .env.local .env  # must be empty
   grep -rn "process.env" app/ components/  # client-side env access (only NEXT_PUBLIC_* allowed)
   ```
4. **Markdown rendering safety** — confirm `MarkdownBody` does not pass parsed content through `dangerouslySetInnerHTML`; react-markdown's default escape is intact

## Output

```
SECURITY SCAN — <date>

  ✓ npm audit: 0 critical, 0 high
  ✓ no dangerouslySetInnerHTML in app/ or components/
  ✗ lib/foo.ts:42 — eval() detected — INVESTIGATE
  ✓ no env vars committed
  ✓ MarkdownBody escapes content via react-markdown
```

If any `✗`, abort the current workflow and surface to the manager.
