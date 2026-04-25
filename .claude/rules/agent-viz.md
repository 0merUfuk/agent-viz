**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# agent-viz — Working Rules

> Auto-loaded for all work in agent-viz. Defines tool boundaries, conventions, and the session protocol.

---

## What This Workspace Is

agent-viz is a Next.js 16 cinematic conference demo for visualizing Claude Code agent ecosystems. It ships two routes:

- `/` — audience cinema (no chrome, full ambient motion, scenario overlays)
- `/stage` — presenter controls (mode toggle, scenario grid, repo loader, cinema preview)

Both routes share state via `BroadcastChannel("agent-viz-cinema-v1")` with a `localStorage` fallback.

Repo: `github.com/SedatSencan/age-of-ai` (public).

---

## Session Start Protocol

1. Read `.claude/VISION.md` if cold-starting
2. Read `.claude/SERVICE_CONTEXT.md` for current state
3. Read `.claude/NEXT_STEPS.md` for what's queued
4. Read `DESIGN.md` if the change touches any visual surface

---

## Directory Structure

```
agent-viz/
├── app/
│   ├── page.tsx               # / — audience cinema
│   ├── stage/page.tsx         # /stage — presenter
│   ├── api/fetch-repo/        # GitHub fetch route
│   └── globals.css            # design tokens + motion keyframes
├── components/
│   ├── shell/                 # Header, StatusBar
│   ├── graph/                 # EcosystemGraph, layout, edges
│   ├── panel/                 # DetailPanel, AgentDetail, SkillDetail, RuleDetail
│   ├── scenarios/             # scripts.ts, ScenarioPlayer, LivePlayer, eventStream
│   ├── cinema/                # CinemaHUD, HandoffStrip, ToolCallStream, Choreography
│   ├── input/                 # RepoLoader
│   └── ui/                    # MarkdownBody, TabSwitch, PortalButton, primitives
├── lib/
│   ├── github.ts              # GitHub API client
│   ├── parser/                # .claude/ → Ecosystem
│   ├── cinema-sync.ts         # BroadcastChannel + localStorage state
│   ├── layout.ts              # graph layout
│   └── types.ts               # Ecosystem, Agent, Skill, Rule types
├── public/                    # circuit-pattern.svg, sample-ecosystem.json
├── scripts/check-brand.sh
├── DESIGN.md
└── .claude/                   # the ecosystem this file documents
```

---

## Context File Rules

### Written freely (gitignored, session-local)
- `tasks/todo.md`
- `tasks/lessons.md`
- `tasks/session-summary.md`

### Read on branches, written on `main`
- `.claude/SERVICE_CONTEXT.md`
- `.claude/NEXT_STEPS.md`
- `.claude/KNOWN_ISSUES.md`

### Append-only
- `.claude/DECISIONS.md` — add new ADRs, never modify existing

### Founding document
- `.claude/VISION.md` — modify to add, not to revise

---

## Surface Boundaries

| Surface | Owns | Does NOT |
|---------|------|---------|
| `app/page.tsx` (`/`) | Audience rendering only | Mode toggle, scenario buttons, repo loader |
| `app/stage/page.tsx` (`/stage`) | Presenter controls, broadcast | Visual rendering of cinema overlays (those mount on `/`) |
| `lib/cinema-sync.ts` | State transport, epoch ordering | UI rendering decisions |
| `lib/parser/` | `.claude/` → `Ecosystem` only | Network calls, UI concerns |
| `components/cinema/*` | Overlay rendering, animation | State mutation (consume only) |
| `components/scenarios/*` | Scenario data + scheduling | DOM rendering (overlays do that) |

If a feature seems to span two surfaces, locate the seam — it usually means a new lib module is needed.

---

## Documentation Conventions

All markdown follows these conventions:

- Frontmatter on every file: Version, Created, Last Updated, Authors (colon inside bold)
- Tree diagrams: Unicode `├──` / `└──` / `│` — never ASCII
- Code blocks: tagged with language
- Section separators: `---` between major `##` sections
- Callouts: `> **Note**:`, `> **Important**:`, `> **Related**:`

---

## Cinema Discipline

- Every animation has a `prefers-reduced-motion` fallback (in `app/globals.css`)
- Scenarios run 30-60s; reduced-motion compresses to ~35% via `EventStreamProvider`
- HUD, HandoffStrip, ToolCallStream, Choreography all subscribe to `useEventStream()`
- Brand safety (`scripts/check-brand.sh`) is a build gate

---

## End of Session

1. Update `.claude/SERVICE_CONTEXT.md` if state changed
2. Add new issues to `.claude/KNOWN_ISSUES.md`
3. Mark completed items in `.claude/NEXT_STEPS.md`
4. Write `tasks/session-summary.md`
5. Run `/session-learn` if patterns or process gaps surfaced
