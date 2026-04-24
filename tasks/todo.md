**Version**: 1.0
**Created**: 2026-04-24
**Last Updated**: 2026-04-24

---

# agent-viz — Execution Checklist

> One-shot build. Check items as they complete. Skills to invoke per phase are annotated in brackets.

---

## Phase 0 — Plan & scaffold

- [x] Next.js 16 app scaffolded (TS, Tailwind v4, App Router, no src dir)
- [x] Deps installed: `@xyflow/react`, `framer-motion`, `gray-matter`, `lucide-react`, `clsx`, `tailwind-merge`
- [x] `DESIGN.md` written — logo-derived visual system
- [x] `PLAN.md` written — full project plan
- [x] `tasks/todo.md` written — this file
- [ ] Green light from user to proceed to Phase 1

---

## Phase 1 — Design tokens & layout shell  [skill: frontend-design]

- [ ] `app/globals.css` — replace scaffold CSS with DESIGN.md tokens + Tailwind layers
- [ ] `app/layout.tsx` — load Cinzel, Orbitron, Inter, JetBrains Mono via `next/font/google`; set metadata title to `agent-viz`; kill the scaffold boilerplate
- [ ] `lib/cn.ts` — clsx + tailwind-merge helper
- [ ] `components/shell/Header.tsx` — logomark (lowercase "agent-viz" in Cinzel with gold gradient on first word), mode toggle, right-side "Load repo" trigger
- [ ] `components/shell/ScenarioBar.tsx` — 3 disabled buttons until data is loaded
- [ ] `components/shell/StatusBar.tsx` — idle dot + counts placeholder
- [ ] `components/ui/Button.tsx` — ghost / primary variants per DESIGN.md
- [ ] `components/ui/Badge.tsx` — for model (O/S/H) chips
- [ ] `app/page.tsx` — compose header + scenario bar + canvas placeholder + status bar
- [ ] Visual smoke test: `npm run dev` renders the shell with correct fonts, colors, spacing

---

## Phase 2 — Data model, parser, sample ecosystem

- [ ] `lib/types.ts` — `Agent`, `Skill`, `Rule`, `Edge`, `Ecosystem` interfaces
- [ ] `lib/parser/parseAgent.ts` — frontmatter → `Agent`; derive `capability`, `canSpawnAgents`, `spawnTargets`
- [ ] `lib/parser/parseSkill.ts` — frontmatter → `Skill`; derive `spawnsAgents`
- [ ] `lib/parser/parseRule.ts` — frontmatter → `Rule`; extract scope line
- [ ] `lib/parser/deriveEdges.ts` — emit `Edge[]` from parsed agents + skills
- [ ] `lib/parser/index.ts` — `buildEcosystem(files: FileMap): Ecosystem`
- [ ] `public/sample-ecosystem.json` — fabricated 10-agent / 8-skill / 3-rule dataset (archetype names only)
- [ ] Unit-parity check: load sample via parser pipeline, assert shape matches JSON output

---

## Phase 3 — Graph rendering  [skill: interface-guidelines]

- [ ] `lib/layout.ts` — layered layout: skills (top row), agents (middle, two sub-rows if >8), rules (bottom strip); horizontal distribution by connection count
- [ ] `components/graph/AgentNode.tsx` — circle 72px, capability ring color, model badge, name label
- [ ] `components/graph/SkillNode.tsx` — 160×44 pill, left gold bar if orchestrator, mono label
- [ ] `components/graph/RuleNode.tsx` — dashed pill, uppercase tracked label
- [ ] `components/graph/edgeStyles.ts` — per-kind stroke / dash / color
- [ ] `components/graph/CanvasBackdrop.tsx` — circuit pattern SVG + 3 radial rings + scattered star points; `prefers-reduced-motion` aware
- [ ] `components/graph/EcosystemGraph.tsx` — React Flow canvas, controls (zoom + fit), node/edge types wired, selection state
- [ ] `public/circuit-pattern.svg` — tileable 240×240 SVG pattern
- [ ] Click a node → selection highlights; related edges emphasized; non-related fade to 20%
- [ ] Keyboard: arrow keys pan, +/- zoom

---

## Phase 4 — Detail panel

- [ ] `components/ui/Sheet.tsx` — right-slide overlay primitive, 480px, focus trap, ESC closes
- [ ] `components/panel/DetailPanel.tsx` — dispatcher based on selected node kind
- [ ] `components/panel/AgentDetail.tsx` — name (Cinzel), model + capability badges, tools list (mono), disallowedTools (muted), maxTurns / memory / isolation rows, prompt-body collapsible
- [ ] `components/panel/SkillDetail.tsx` — `/name` mono title, description, argumentHint, allowed-tools list, body preview
- [ ] `components/panel/RuleDetail.tsx` — name, scope, body preview
- [ ] Closing the panel restores fade on other nodes

---

## Phase 5 — Scenario player (Demo mode)

- [ ] `components/scenarios/scripts.ts` — 3 scenarios defined (`s1-review`, `s2-strategy`, `s3-pipeline`)
- [ ] `components/scenarios/ScenarioPlayer.tsx` — step runner; emits `activeNodeIds` / `activeEdgeIds` via context
- [ ] Graph reacts to active sets: nodes pulse (framer-motion scale + glow), edges animate stroke-dashoffset
- [ ] `ScenarioBar` wires buttons to runner; disabled while running; cancel button appears mid-run
- [ ] Status bar shows current step label while running
- [ ] `prefers-reduced-motion`: instant transitions instead of tweens

---

## Phase 6 — GitHub URL input

- [ ] `lib/github.ts` — `listClaudeDir(owner, repo)`, `fetchRaw(url)`; handles trees recursively
- [ ] `app/api/fetch-repo/route.ts` — POST `{slug}` → `Ecosystem | {error}`; uses `GITHUB_TOKEN` if present
- [ ] `components/input/RepoLoader.tsx` — modal sheet with input, "Load sample" alt button, error surfacing (no-claude-dir / rate-limit / private / unknown)
- [ ] Header "Load repo" button opens the loader
- [ ] Successful load replaces ecosystem state; graph re-layouts
- [ ] URL normalization: accept 3 formats (`owner/repo`, `github.com/owner/repo`, full HTTPS URL)

---

## Phase 7 — Live mode bridge

- [ ] `bridge/package.json` — Node 18+, one dep `ws`
- [ ] `bridge/server.js` — http server on :4001; endpoints `/health`, `/run`, `/abort`, `/hook/:kind`; WS at `/ws`
- [ ] `bridge/scenarios.js` — map `scenarioId` → `{cwd, prompt, agent?}`
- [ ] `bridge/demo-cwd/` — pre-seeded tiny project for S3
- [ ] `bridge/README.md` — hook config snippet (add/remove), startup order, troubleshooting
- [ ] `lib/bridge-client.ts` — WS client, auto-reconnect, typed event stream
- [ ] `app/page.tsx` — on mount, probe `:4001/health`; expose `liveAvailable` state
- [ ] Mode toggle in header: Demo / Live (disabled with tooltip if bridge absent)
- [ ] Live mode: scenario click → POST `/run`; subscribe to WS; map hook events to node highlights
- [ ] Live mode: 30s stall → abort + toast
- [ ] `scripts/demo-up.sh` — starts bridge + dev server; Ctrl-C kills both

---

## Phase 8 — Polish  [skill: design-polish, design-review]

- [ ] Spacing sweep: every block on an 8px grid, except type which uses its own rhythm
- [ ] Contrast audit: every text/UI pair ≥ WCAG AA
- [ ] Focus rings visible on every interactive element
- [ ] Empty state copy: one sentence, centered, with the URL input beneath
- [ ] Loading states for GitHub fetch and scenario warmup
- [ ] Error states for: bridge down, GitHub 403, no `.claude/` dir, malformed frontmatter
- [ ] Favicon: a stylized `AV` or circuit node
- [ ] Mobile: graph pans cleanly; scenario bar collapses to dropdown; panel becomes full-width
- [ ] Brand-safety gate passes: `bash scripts/check-brand.sh` exits 0 (reads `.brand-forbidden` which the presenter seeds locally)

---

## Phase 9 — Local-run finalize (no deployment)

- [ ] `vercel.json` — default Next preset, env var hint for `GITHUB_TOKEN` (repo is deploy-ready but agent does NOT deploy)
- [ ] `README.md` — brandless public-facing docs: what it is, quickstart (`npm install && npm run dev`), live-mode pointer to `bridge/README.md`, `GITHUB_TOKEN` config, project tree, MIT license. No "Deploy to Vercel" button.
- [ ] `npm run build` passes with zero errors
- [ ] `npm run dev` serves without console errors
- [ ] `bash scripts/check-brand.sh` exits 0 (final brand-safety verification)
- [ ] Final commit + push

Out of scope (presenter handles in person):
- Vercel deployment (presenter does this manually)
- Demo video recording (presenter records from local dev)
- MP4 export for the meetup

---

## Commit strategy

One commit per phase, conventional commit format:
- `docs: add DESIGN.md, PLAN.md, and todo checklist` (Phase 0)
- `feat(shell): design tokens, layout, header, scenario bar` (Phase 1)
- `feat(parser): ecosystem schema and markdown parser` (Phase 2)
- `feat(graph): React Flow canvas with custom node types` (Phase 3)
- `feat(panel): detail panel for agents, skills, rules` (Phase 4)
- `feat(scenarios): scripted player with 3 scenarios` (Phase 5)
- `feat(input): GitHub URL loader with API proxy` (Phase 6)
- `feat(bridge): local daemon for live mode` (Phase 7)
- `chore(polish): spacing, contrast, a11y, error states` (Phase 8)
- `chore(finalize): vercel config, README, build verification` (Phase 9)

Push after each phase so the commit history tells a clean story.
