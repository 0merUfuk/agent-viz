**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# agent-viz — Project Context for Claude Code

> Cold-start guide for Claude Code sessions. If you are starting fresh or after a context compaction, read `.claude/VISION.md` first.

---

## What This Is

agent-viz is a Next.js 16 cinematic conference demo for visualizing Claude Code agent ecosystems. Two routes:

- `/` — audience cinema (no chrome, full ambient motion)
- `/stage` — presenter controls (mode toggle, scenarios, repo loader)

State syncs across tabs via `BroadcastChannel("agent-viz-cinema-v1")` with a `localStorage` fallback. Repo: `github.com/SedatSencan/age-of-ai` (public).

---

## Agent Roster

10 specialized agents in `.claude/agents/`. Use the manager for full pipelines; use direct agents for focused work.

| Agent | Model | Role |
|-------|-------|------|
| `manager` | opus | Orchestrator — spawns the pipeline, creates PRs |
| `developer` | opus | TypeScript / Next.js implementation in worktree |
| `tester` | sonnet | Vitest + Playwright in worktree |
| `reviewer` | sonnet | Adversarial read-only review |
| `strategist` | opus | Product / scenario research |
| `security-reviewer` | sonnet | OWASP + ASI audit (read-only) |
| `architect` | opus | Provisions agents/skills/rules via `/provision` |
| `product-lead` | opus | CEO perspective — strategy, kill criteria |
| `tech-lead` | opus | CTO perspective — perf, deps, drift (read-only) |
| `growth-lead` | opus | CMO perspective — channels, content |

```bash
claude --agent manager      # full pipeline
claude --agent developer    # focused implementation
claude --agent strategist   # scenario / market research
```

---

## Skills

14 skills in `.claude/skills/<name>/SKILL.md`:

`audit`, `commit`, `doublecheck`, `fix`, `issue`, `owasp-review`, `provision`, `release`, `scenario-add`, `secret-scan`, `security-scan`, `session-learn`, `strategy-weekly`, `strategy-monthly`.

`scenario-add` is the agent-viz-specific authoring pipeline for new cinema scenarios.

---

## Auto-Loaded Rules

All files in `.claude/rules/` load into every context window:

- `agent-viz.md` — workspace working rules, surface boundaries, session protocol
- `typescript-baseline.md` — TypeScript security baseline (markdown injection, env hygiene, URL construction)
- `ecosystem-conventions.md` — frontmatter conventions for agents, skills, rules

---

## Before Working Here

1. Read `.claude/VISION.md` for founding context
2. Read `.claude/SERVICE_CONTEXT.md` for current state
3. Read `.claude/NEXT_STEPS.md` for prioritized work
4. Read `DESIGN.md` if your change touches a visual surface

---

## Key Commands

```bash
npm run dev                        # local dev (Turbopack)
npm run build                      # production build
npm run lint                       # eslint
bash scripts/check-brand.sh        # brand-safety gate (build blocker)
```

---

## Surface Boundaries

| Surface | Owns | Does NOT |
|---------|------|----------|
| `app/page.tsx` (`/`) | Audience rendering | Mode toggle, scenario buttons |
| `app/stage/page.tsx` (`/stage`) | Presenter controls, broadcast | Visual rendering of overlays |
| `lib/cinema-sync.ts` | Transport, epoch ordering | UI rendering |
| `lib/parser/` | `.claude/` → `Ecosystem` | Network, UI |
| `components/cinema/*` | Overlays, animation | State mutation (consume only) |
| `components/scenarios/*` | Scenario data + scheduling | DOM rendering |

If a feature spans two surfaces, look for a missing lib module.

---

## Self-Referential Demo Contract

This repo dogfoods. The default RepoLoader Try-button loads `SedatSencan/age-of-ai` itself. Whenever you change parser shape or `.claude/` frontmatter conventions, run `npm run build` and load the repo in `/stage` to confirm the cinema graph still renders correctly.

---

## Work Protocol

- **Session start**: read VISION → SERVICE_CONTEXT → NEXT_STEPS
- **Active work**: track in `tasks/` (gitignored, session-local)
- **Architectural decisions**: append to `.claude/DECISIONS.md` (never modify existing entries)
- **Issues**: add to `.claude/KNOWN_ISSUES.md`
- **Session end**: update SERVICE_CONTEXT if state changed; run `/session-learn` if patterns surfaced

---

## Reference Index

| Document | Purpose |
|----------|---------|
| `.claude/VISION.md` | Founding context, system topology |
| `.claude/DECISIONS.md` | Architectural ADRs |
| `.claude/SERVICE_CONTEXT.md` | Current state |
| `.claude/NEXT_STEPS.md` | Prioritized work |
| `.claude/KNOWN_ISSUES.md` | Open issues |
| `.claude/rules/` | Auto-loaded working rules |
| `.claude/agents/` | 10 agent definitions |
| `.claude/skills/` | 14 skill definitions |
| `DESIGN.md` | Visual / motion / brand specification |
