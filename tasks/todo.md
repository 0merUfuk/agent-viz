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

- [x] `app/globals.css` — replace scaffold CSS with DESIGN.md tokens + Tailwind layers
- [x] `app/layout.tsx` — load Cinzel, Orbitron, Inter, JetBrains Mono via `next/font/google`; set metadata title to `agent-viz`; kill the scaffold boilerplate
- [x] `lib/cn.ts` — clsx + tailwind-merge helper
- [x] `components/shell/Header.tsx` — logomark (lowercase "agent-viz" in Cinzel with gold gradient on first word), mode toggle, right-side "Load repo" trigger
- [x] `components/shell/ScenarioBar.tsx` — 3 disabled buttons until data is loaded
- [x] `components/shell/StatusBar.tsx` — idle dot + counts placeholder
- [x] `components/ui/Button.tsx` — ghost / primary variants per DESIGN.md
- [x] `components/ui/Badge.tsx` — for model (O/S/H) chips
- [x] `app/page.tsx` — compose header + scenario bar + canvas placeholder + status bar
- [x] Visual smoke test: `npm run build` succeeds with fonts/colors/spacing applied

---

## Phase 2 — Data model, parser, sample ecosystem

- [x] `lib/types.ts` — `Agent`, `Skill`, `Rule`, `Edge`, `Ecosystem` interfaces
- [x] `lib/parser/parseAgent.ts` — frontmatter → `Agent`; derive `capability`, `canSpawnAgents`, `spawnTargets`
- [x] `lib/parser/parseSkill.ts` — frontmatter → `Skill`; derive `spawnsAgents`
- [x] `lib/parser/parseRule.ts` — frontmatter → `Rule`; extract scope line
- [x] `lib/parser/deriveEdges.ts` — emit `Edge[]` from parsed agents + skills
- [x] `lib/parser/index.ts` — `buildEcosystem(files: FileMap): Ecosystem`
- [x] `public/sample-ecosystem.json` — fabricated 10-agent / 8-skill / 3-rule dataset (archetype names only)
- [x] Build passes with parser compiled in

---

## Phase 3 — Graph rendering  [skill: interface-guidelines]

- [x] `lib/layout.ts` — layered layout: skills (top row), agents (middle, two sub-rows if >8), rules (bottom strip); horizontal distribution by connection count
- [x] `components/graph/AgentNode.tsx` — circle 72px, capability ring color, model badge, name label
- [x] `components/graph/SkillNode.tsx` — 180×44 pill, left gold bar if orchestrator, mono label
- [x] `components/graph/RuleNode.tsx` — dashed pill, uppercase tracked label
- [x] `components/graph/edgeStyles.ts` — per-kind stroke / dash / color
- [x] `components/graph/CanvasBackdrop.tsx` — circuit pattern SVG + 3 radial rings + scattered star points + code fragments; prefers-reduced-motion aware
- [x] `components/graph/EcosystemGraph.tsx` — React Flow canvas, controls (zoom + fit), node/edge types wired, selection state
- [x] `public/circuit-pattern.svg` — tileable 240×240 SVG pattern
- [x] Click a node → selection highlights; related edges emphasized; non-related fade to 20%
- [x] React Flow built-in keyboard pan/zoom enabled

---

## Phase 4 — Detail panel

- [x] `components/ui/Sheet.tsx` — right-slide overlay primitive, 480px, focus trap, ESC closes
- [x] `components/panel/DetailPanel.tsx` — dispatcher based on selected node kind
- [x] `components/panel/AgentDetail.tsx` — name (Cinzel), model + capability badges, tools list (mono), disallowedTools (muted), maxTurns / memory / isolation rows, prompt-body collapsible
- [x] `components/panel/SkillDetail.tsx` — `/name` mono title, description, argumentHint, allowed-tools list, body preview
- [x] `components/panel/RuleDetail.tsx` — name, scope, body preview
- [x] Closing the panel restores fade on other nodes (selection clears)

---

## Phase 5 — Scenario player (Demo mode)

- [x] `components/scenarios/scripts.ts` — 3 scenarios defined (`s1-review`, `s2-strategy`, `s3-pipeline`)
- [x] `components/scenarios/ScenarioPlayer.tsx` — step runner; emits `activeNodeIds` / `activeEdgeIds` via context
- [x] Graph reacts to active sets: nodes pulse (CSS keyframe glow), edges stroke-dashoffset animate
- [x] `ScenarioBar` wires buttons to runner; disabled while running; stop button appears mid-run
- [x] Status bar shows current step label while running
- [x] `prefers-reduced-motion`: instant transitions instead of tweens

---

## Phase 6 — GitHub URL input

- [x] `lib/github.ts` — `parseSlug`, `fetchClaudeDir`; handles tree recursion
- [x] `app/api/fetch-repo/route.ts` — POST `{slug}` → `Ecosystem | {error}`; uses `GITHUB_TOKEN` if present
- [x] `components/input/RepoLoader.tsx` — modal with input, "Load sample" alt, error surfacing (no-claude-dir / rate-limit / private / unknown)
- [x] Header "Load repo" button opens the loader
- [x] Successful load replaces ecosystem state; graph re-layouts
- [x] URL normalization: accept 3 formats (`owner/repo`, `github.com/owner/repo`, full HTTPS URL)

---

## Phase 7 — Live mode bridge

- [x] `bridge/package.json` — Node 18+, one dep `ws`
- [x] `bridge/server.js` — http server on :4001; endpoints `/health`, `/run`, `/abort`, `/hook/:kind`; WS at `/ws`
- [x] `bridge/scenarios.js` — map `scenarioId` → `{cwd, prompt, agent?}`
- [x] `bridge/demo-cwd/` — pre-seeded tiny project for S3 (TODO.md with Go capitalize task)
- [x] `bridge/README.md` — hook config snippet (add/remove), startup order, troubleshooting
- [x] `lib/bridge-client.ts` — WS client, auto-reconnect, typed event stream, probe, run, abort helpers
- [x] `app/page.tsx` — on mount, probe `:4001/health`; expose `liveAvailable` state (polled every 10s)
- [x] Mode toggle in header: Demo / Live (disabled with tooltip if bridge absent)
- [x] Live mode: scenario click → POST `/run`; subscribe to WS; map hook events to node highlights
- [x] Live mode: 30s stall → auto-switch to demo mode + error toast
- [x] `scripts/demo-up.sh` — starts bridge + dev server; Ctrl-C kills both

---

## Phase 8 — Polish  [skill: design-polish, design-review]

- [x] Spacing sweep: every block on an 8px grid, except type which uses its own rhythm
- [x] Contrast audit: bumped --text-muted and --text-dim to satisfy WCAG AA on --abyss
- [x] Focus rings visible on every interactive element (Header ModeButton, RepoLoader close, skip link)
- [x] Empty state copy: "observe the ecosystem" hero + one-liner + URL/sample CTAs
- [x] Loading states for GitHub fetch (RepoLoader "Loading…") and sample load (EmptyCanvas disabled)
- [x] Error states for: bridge down (toast), GitHub 403/404/429 (RepoLoader AlertTriangle), no `.claude/` dir, sample load failure (toast)
- [x] Favicon: stylized radiating-node SVG at `app/icon.svg`
- [x] Mobile: Sheet `w-full` on <sm; ScenarioBar overflow-x-auto; Header hides subtitle <md; Toast centered
- [x] Brand-safety gate passes: `bash scripts/check-brand.sh` exits 0

---

## Phase 9 — Local-run finalize (no deployment)

- [x] `vercel.json` — default Next preset, env var hint for `GITHUB_TOKEN` (repo is deploy-ready but agent does NOT deploy)
- [x] `README.md` — brandless public-facing docs: what it is, quickstart, live-mode pointer to `bridge/README.md`, `GITHUB_TOKEN` config, project tree, MIT license. No "Deploy to Vercel" button.
- [x] `LICENSE` — MIT, no brand references
- [x] `npm run build` passes with zero errors
- [x] `bash scripts/check-brand.sh` exits 0 (final brand-safety verification)
- [x] Final commit + push

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

---

## Post-Phase 9 — Cinematic polish (user-requested)

After the one-shot build, user asked for a more cinematic surface and
audience-friendly chrome. Shipped across 5 commits on `main`:

- [x] `c8c29f8` feat(header): add conference logo to top-left (44×44 jpeg)
- [x] `eb51f89` fix(header): drop agent-viz wordmark next to conference logo
- [x] `3357b67` docs(design): codify motion, audience vs presenter, portal button
       — bumped DESIGN.md 1.0 → 1.1, added §14 (audience/presenter), §15 (portal button),
         split §9 Motion into core + ambient tokens
- [x] `af030e7` feat(canvas): 5-layer parallax backdrop with deep-space motion
       — nebula / starfield (120 twinkling stars) / 3 orbital rings /
         circuit drift / 18–42s gold shooting stars; reduced-motion respected
- [x] `1daba0c` feat(shell): portal button + presenter-mode gate
       — Audience view hides Demo/Live, Load-repo, mode label, scenario bar.
         Triple-tap-`p` within 600ms toggles. Auto-loads sample on mount so
         audience never sees a blank canvas. PortalButton replaces flat blue CTA.
         Animated gold hairline sweep under header.
- [x] `a240703` feat(motion): interaction polish — lock-on, running glow, scenario trace
       — one-shot ring pulse on node selection (also serves as panel-open flare),
         persistent red halo on running state-dot, cyan hotspot hover-sweep on
         scenario buttons.

All additions respect `prefers-reduced-motion`. Brand-safety + `npm run build`
pass on every commit.
