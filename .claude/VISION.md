**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# agent-viz — Vision

> The founding context for this project. Read first when starting cold or after a context compaction.

---

## What agent-viz Is

agent-viz is a **cinematic conference demo** for visualizing Claude Code agent ecosystems. It takes a real `.claude/` directory and renders it as a living, animated, narratable graph an audience can follow in real time.

The demo ships two routes:

- **`/`** — audience cinema. No chrome, full ambient motion, scenario overlays driven from the presenter route
- **`/stage`** — presenter controls. Mode toggle, scenario grid, repo loader, cinema preview

The two routes share state via `BroadcastChannel("agent-viz-cinema-v1")` with a `localStorage` fallback, supporting multi-screen presentation rigs and late-joining tabs.

---

## Why It Exists

Engineering teams adopting agent ecosystems struggle to *see* what they own. A `.claude/` directory is opaque — a folder of markdown files. agent-viz turns that folder into a comprehensible artifact:

- **For the conference audience**: a 30–60 second cinematic that shows what an autonomous agent pipeline actually looks like, without code on screen
- **For engineers in the audience**: a credible reference architecture they can dogfood — load their own repo and see the same shape
- **For go-to-market**: a non-trivial demo surface that communicates "this is real, this works, you can run it"

agent-viz is **not** a debugger, a profiler, or a runtime monitor. It is a presentation surface for static ecosystem topology plus scripted scenario playback.

---

## Design Philosophy

Three commitments shape every decision:

1. **Cinema discipline.** Every animation has a `prefers-reduced-motion` fallback. Scenarios run 30–60 seconds at full motion and ~35% of that with reduced motion. Pacing is non-uniform — handoffs every 2–4s, tool events every 0.8–1.5s during active work, deliberate quiet windows around builds and synthesis.
2. **Self-referential dogfood.** This very repo ships its own `.claude/` ecosystem so the demo can load `SedatSencan/age-of-ai` and show the audience the agents that built the demo. No GitHub token required.
3. **Brand safety as a build gate.** `scripts/check-brand.sh` is a hard gate in CI. The conference surface is part of the marketing surface; one off-tone string can damage the launch.

---

## System Topology

```
agent-viz/
├── app/
│   ├── page.tsx               # / — audience cinema (no chrome)
│   ├── stage/page.tsx         # /stage — presenter controls
│   ├── api/fetch-repo/        # GitHub API proxy with auth disambiguation
│   └── globals.css            # design tokens + motion keyframes
├── components/
│   ├── shell/                 # Header, StatusBar
│   ├── graph/                 # EcosystemGraph + edge derivation
│   ├── panel/                 # DetailPanel and per-type renderers
│   ├── scenarios/             # scripts.ts + scheduling
│   ├── cinema/                # CinemaHUD, HandoffStrip, ToolCallStream, Choreography
│   ├── input/                 # RepoLoader
│   └── ui/                    # MarkdownBody, primitives
├── lib/
│   ├── github.ts              # GitHub fetch with typed error codes
│   ├── parser/                # .claude/ → Ecosystem
│   ├── cinema-sync.ts         # BroadcastChannel transport with localStorage fallback
│   ├── layout.ts              # graph layout
│   └── types.ts               # Ecosystem, Agent, Skill, Rule
├── public/                    # circuit-pattern.svg, sample-ecosystem.json
└── .claude/                   # this very ecosystem
```

### Data Flow

```
RepoLoader → /api/fetch-repo → lib/github.ts → lib/parser/ → Ecosystem
                                                                ↓
                                                           lib/layout.ts
                                                                ↓
                                                          EcosystemGraph
                                                                ↓
                                                       cinema-sync (epoch + state)
                                                                ↓
                                              audience overlays subscribe to useEventStream()
```

---

## Founding Decisions

These are the load-bearing architectural choices. Subsequent ADRs in `DECISIONS.md` extend them — they should not be overturned without an explicit ADR.

- **Two-route split** — the audience surface (`/`) renders only what the presenter (`/stage`) commands. This separation lets the audience screen stay pristine while the presenter has full control affordances
- **BroadcastChannel transport with localStorage fallback** — no server-side cinema state. State is owned by the presenter tab and broadcast; late-joining tabs request snapshots via a hello handshake
- **Self-referential ecosystem** — agent-viz dogfoods. The conference demo loads agent-viz itself by default, eliminating the need for a token
- **Static topology, scripted scenarios** — agent runtime telemetry is out of scope. Scenarios are hand-authored timelines with deterministic pacing
- **Frontmatter-keyed parser** — `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` are parsed via `gray-matter`. Conventions in `.claude/rules/ecosystem-conventions.md` are load-bearing for the visualization

---

## Surface Boundaries

| Surface | Owns | Does NOT Own |
|---------|------|--------------|
| `app/page.tsx` (`/`) | Audience rendering, ambient motion, overlay mounting | Mode toggle, scenario triggers, repo loader UI |
| `app/stage/page.tsx` (`/stage`) | Presenter controls, broadcast emission | Visual rendering of cinema overlays (those mount on `/`) |
| `lib/cinema-sync.ts` | State transport, epoch ordering, hello handshake | UI rendering decisions |
| `lib/parser/` | `.claude/` → `Ecosystem` shape | Network calls, UI concerns |
| `components/cinema/*` | Overlay rendering, animation | State mutation (consume only) |
| `components/scenarios/*` | Scenario data + scheduling | DOM rendering (overlays do that) |

If a feature seems to span two surfaces, it usually means a new lib module is needed.

---

## What Success Looks Like

For the conference itself:

- A live audience can follow a 30–60s scenario without prior context and understand what an autonomous agent pipeline does
- The presenter can load any public `.claude/` repo and watch it render in real time
- Reduced-motion mode produces the same narrative arc at ~35% wall-clock duration
- No off-brand strings, no broken animations, no console errors during the live run

After the conference:

- The repo is a reference implementation engineers fork to visualize their own ecosystems
- The cinema discipline section becomes a template for other Claude Code presentation surfaces
- agent-viz earns its lineage by being itself an agent-built artifact

---

## What Is Out of Scope

- Live runtime telemetry from actual Claude Code sessions
- Editing `.claude/` files in the browser
- User accounts, sessions, persistence beyond `localStorage`
- Anything that would require a backend server beyond Next.js route handlers

If a request touches any of the above, push back and seek a way to express the value within the static-topology + scripted-scenario contract.
