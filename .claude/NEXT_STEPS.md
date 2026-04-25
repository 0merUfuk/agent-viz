**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# agent-viz — Next Steps

> Prioritized work queue. Mark items ✅ as they complete. Update phasing when priorities shift.

---

## Phase 0 — Conference Readiness (Blocking)

These must be green before the live demo.

- [ ] **Self-referential ecosystem** (in flight on `feat/dogfood-claude-ecosystem`) — `.claude/` provisioned, agent-viz loads itself without a token
- [ ] **Smoke test pass** — `/stage` loads `SedatSencan/age-of-ai` and renders all 10 agents, 14 skills, 3 rules with correct capability coloring
- [ ] **Three scenarios full-run** — `dev-pipeline`, `strategy-review`, `review-diff` each complete end-to-end at full motion and reduced motion
- [ ] **Brand-safety gate clean** — `bash scripts/check-brand.sh` passes against the dogfood ecosystem content
- [ ] **No console errors** during a 60s scenario on `/`
- [ ] **Multi-screen rig test** — open `/stage` and `/` in separate windows, confirm BroadcastChannel sync, late-join handshake, and reduced-motion contract

---

## Phase 1 — Polish (Should-Have for Conference)

- [ ] **HUD numeric stability** — agent count and elapsed should not jitter on reduced motion
- [ ] **Scenario boundary smoothing** — scenario change should not flash the previous overlay
- [ ] **RepoLoader keyboard support** — Enter submits, Escape closes
- [ ] **Status bar metric polish** — last-loaded repo and parser timing visible

---

## Phase 2 — Post-Conference Content

- [ ] **Live mode wiring** — accept real Claude Code session events (file watcher or local websocket) for unscripted playback
- [ ] **Scenario authoring docs** — DESIGN.md §17 expansion with copy-paste templates
- [ ] **Custom-repo gallery** — curated list of public `.claude/` ecosystems beyond the SuperClaude / claude-code / awesome-claude-code Try-buttons
- [ ] **Perf budget enforcement** — Lighthouse CI run on `/`, fail builds that regress LCP or CLS

---

## Phase 3 — Distribution

- [ ] **Standalone artifact** — Vercel deploy with cinema route exposed
- [ ] **Embed mode** — iframe-friendly variant of `/` for partner sites
- [ ] **Public RepoLoader sharing** — URL params encode repo + scenario for shareable cinema links

---

## Backlog (Not Yet Phased)

- Branch toggle in RepoLoader (currently parses default branch only)
- Skill-spawns-skill edge derivation (parser currently misses)
- Multi-language scenario titles
- A/B test of pacing variants for the dev-pipeline scenario
- Telemetry: anonymized scenario completion rate
