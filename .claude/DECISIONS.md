**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# agent-viz — Architectural Decisions

> Append-only ADR log. Add new entries — never modify existing ones. If a decision is reversed, write a new ADR that supersedes the prior one.

---

## D-001 — Two-Route Audience / Presenter Split

**Date:** 2026-04-23
**Status:** Accepted

### Context

The conference demo runs on two screens — one facing the audience, one facing the presenter. A single-route design would force chrome (controls, mode toggles, repo loader) onto the audience screen or hide it behind keystrokes.

### Decision

Split the surface into `/` (audience, no chrome, full ambient motion) and `/stage` (presenter, full controls). Share state via `BroadcastChannel` with a `localStorage` fallback. Late-joining audience tabs request a state snapshot via a hello handshake.

### Consequences

- + Audience screen stays pristine and cinematic
- + Presenter has every affordance without polluting the audience view
- + Multi-screen rigs are first-class
- − Two surfaces to maintain; surface-boundary discipline becomes load-bearing
- − No server-side persistence; refreshing both tabs at once loses state until the presenter reseeds

---

## D-002 — BroadcastChannel as Cinema Transport

**Date:** 2026-04-23
**Status:** Accepted

### Context

The two-route split requires inter-tab state sync. Options considered: server-side socket, shared service worker, BroadcastChannel + localStorage, polling a JSON file.

### Decision

Use `BroadcastChannel("agent-viz-cinema-v1")` with a `localStorage` fallback for browsers or contexts where BroadcastChannel is unavailable. Epoch-key every message so out-of-order delivery is rejected. Implement a hello handshake so late-joining tabs can request the current snapshot from the presenter.

### Consequences

- + Zero backend infrastructure
- + Works offline; works at conference Wi-Fi-hostile venues
- + Fast — no network round-trip
- − Same-origin only (acceptable: both routes serve from the same Next.js app)
- − Channel name change is a breaking change for any preserved state — bump the suffix and call it out as MAJOR per `versioning.md`

---

## D-003 — Self-Referential Dogfood Ecosystem

**Date:** 2026-04-25
**Status:** Accepted

### Context

The repo loader's most natural demos are the user's own private repos, but those require a `GITHUB_TOKEN`. Without a token, public Try-button candidates (`anthropics/claude-code`, `SuperClaude_Framework`) render sparsely or render only commands. The conference demo needs a credible default that renders richly with **zero** configuration.

### Decision

Provision agent-viz with its own complete `.claude/` ecosystem: 10 agents (manager, developer, tester, reviewer, strategist, security-reviewer, architect, product-lead, tech-lead, growth-lead), 14 skills (audit, commit, doublecheck, fix, issue, owasp-review, provision, release, secret-scan, security-scan, session-learn, strategy-weekly, strategy-monthly, plus a custom `scenario-add` skill), and 3 rules (`agent-viz.md`, `typescript-baseline.md`, `ecosystem-conventions.md`). Make `0merUfuk/agent-viz` the default RepoLoader Try-button.

### Consequences

- + Zero-config demo that renders richly
- + The ecosystem is real — these agents actually work on this repo
- + Earns its lineage by being itself an agent-built artifact
- + Reference implementation engineers can fork
- − Maintenance burden: changing the cinema parser shape can break the rendering of this very ecosystem; CI must include a self-load smoke test
- − The ecosystem must remain accurate — drift between `.claude/` and the repo's actual conventions damages credibility

### Supersedes

- The prior assumption that the demo defaults to a sample JSON; sample JSON is now a fallback only

---

## D-004 — Cinematic Pacing Range 30–60s

**Date:** 2026-04-25
**Status:** Accepted

### Context

Initial scenarios ran 6–17 seconds — too fast for a live audience to read overlays, follow handoffs, or absorb verdicts. User explicitly raised this: "Okay it should take more than 6.6sec for review a diff, 8.4 sec for strategy review, 16.4 sec for dev pipeline."

### Decision

Every scenario lives in 30–60 seconds at full motion. Pacing is non-uniform — handoffs every 2–4s, tool events every 0.8–1.5s during active work, deliberate quiet windows around Bash builds, subagent spawns, and synthesis narration. Reduced-motion compresses to ~35% via `EventStreamProvider` so the same arc plays in 11–21s.

### Consequences

- + Audience can actually follow the narrative
- + Quiet windows feel intentional, not awkward
- + Reduced-motion still tells a complete story
- − Scenario authoring is more demanding; authors must place quiet windows by hand
- − Non-uniform scaling means scenarios cannot be retimed by a single multiplier
