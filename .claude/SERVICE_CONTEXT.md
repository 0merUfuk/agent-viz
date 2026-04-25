**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# agent-viz — Service Context

> Snapshot of current state. Update when tool state, route inventory, scenarios, or build gates change.

---

## Build & Runtime

| Concern | State |
|---------|-------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript with `strictNullChecks` |
| Node target | 20.x |
| Package manager | npm (with `package-lock.json` committed) |
| Build command | `npm run build` |
| Dev command | `npm run dev` |
| Brand-safety gate | `bash scripts/check-brand.sh` (must pass before commit) |

---

## Routes

| Route | Purpose | Notes |
|-------|---------|-------|
| `/` | Audience cinema | No chrome, full ambient motion, overlays mount here |
| `/stage` | Presenter controls | Mode toggle, scenario grid, repo loader, cinema preview |
| `/api/fetch-repo` | GitHub fetch proxy | Disambiguates private vs missing repo vs missing `.claude/` |

---

## Cinema Overlays (mount on `/`)

| Component | Position | Purpose |
|-----------|----------|---------|
| `CinemaHUD` | top-right | Live metrics (elapsed, agent count, current scenario) |
| `HandoffStrip` | bottom-right | Agent-to-agent delegation cards |
| `ToolCallStream` | right 380px | Terminal-style tool execution log |
| `Choreography` | full-screen | Verdict banner + flash transitions |

All overlays subscribe to `useEventStream()` and respect `prefers-reduced-motion`.

---

## Scenario Inventory

Source: `components/scenarios/scripts.ts`. Pacing rescaled 2026-04-25 from 6–17s to 33–61s.

| ID | Title | Duration | Notes |
|----|-------|----------|-------|
| `dev-pipeline` | Dev Pipeline | ~60.9s | Manager → developer → tester → reviewer → security-reviewer; Bash builds with deliberate quiet windows |
| `strategy-review` | Strategy Review | ~45s | Three leads in parallel + architect refresh |
| `review-diff` | Review a Diff | ~33s | Reviewer pass with confidence verdict |

Reduced-motion compresses to ~35% via `EventStreamProvider`.

---

## State Transport

- Channel: `BroadcastChannel("agent-viz-cinema-v1")`
- Fallback: `localStorage` poll on the same key
- Hello-handshake: late-joining tabs request snapshot from presenter
- Epoch-keyed: out-of-order messages dropped by epoch comparison
- Module: `lib/cinema-sync.ts`

---

## Parser Surface

Source: `lib/parser/`. Inputs:

| Input | Producer | Required Frontmatter |
|-------|----------|----------------------|
| `.claude/agents/*.md` | gray-matter | `name`, `description`, `tools`, `model`, optional `disallowedTools`, `isolation`, `memory` |
| `.claude/skills/<name>/SKILL.md` | gray-matter | `description`, `argument-hint`, `allowed-tools` |
| `.claude/rules/*.md` | first H1 + frontmatter | Standard Version/Created/Last Updated/Authors |

Edge derivation:
- Agent → Agent via `Agent("name")` regex and `subagent_type:` mentions in body
- Skill → Agent via `Agent(...)` entries in `allowed-tools`
- Capability inferred from `disallowedTools` (read-only) vs `tools` containing Write/Edit (write-capable)

---

## Self-Referential Demo

This repo ships its own `.claude/` so the demo can render itself without a token.

- Default Try-button in RepoLoader: `SedatSencan/age-of-ai`
- Expected render: ~10 agents, ~14 skills, ~3 rules
- Smoke test: `/stage` → load `SedatSencan/age-of-ai` → confirm rich graph

---

## Active Branch

| Branch | Purpose |
|--------|---------|
| `main` | Released cinema |
| `feat/dogfood-claude-ecosystem` | Self-referential `.claude/` provisioning (current work) |

---

## GitHub Integration

- Public reads: unauthenticated, 60 req/hr
- Private reads / higher rate limit: `GITHUB_TOKEN` env var with `repo` scope
- Token lives only in `.env.local` (gitignored)
- Error codes: `repo-not-found`, `no-claude-dir`, `rate-limited`, `network`
- Module: `lib/github.ts`

---

## Known Gates Before Public Launch

- `npm run build` clean
- `bash scripts/check-brand.sh` clean
- `/stage` smoke-loads `SedatSencan/age-of-ai` and renders cinema graph
- All three scenarios run end-to-end at full + reduced motion
- No console errors on `/` during a 60s scenario
