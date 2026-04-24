**Version**: 1.0
**Created**: 2026-04-24
**Last Updated**: 2026-04-24
**Authors**: Ömer Ufuk

---

# agent-viz — Project Plan

> A one-screen Next.js app that parses a `.claude/` directory and renders the agent/skill/rule ecosystem as an interactive graph, with a scripted scenario player and an optional local bridge for **real** agent execution. Built for a single conference demo; optimized for clarity on stage and in a recorded video.

---

## 1. Goals

- **Primary**: a live-demo-able visualization of an autonomous-agent ecosystem, hosted on Vercel, that accepts any public GitHub repo containing `.claude/` and renders its topology.
- **Secondary**: an optional live-execution mode where pressing a scenario button spawns a real `claude` CLI session on the presenter's laptop and the dashboard animates in response to real hook events.
- **Out of scope**: authoring, editing, or saving ecosystems; multi-user accounts; persistence beyond browser session; anything that touches the presenter's other repos by name.

---

## 2. Success Criteria

- [ ] Empty-state-first load: blank canvas with a URL input + "Load sample" button
- [ ] Pasting a valid public GitHub URL with `.claude/` renders the graph in under 5 seconds
- [ ] Clicking any node opens a detail panel with the correct parsed metadata
- [ ] All three scenarios play end-to-end without breaking in Demo mode
- [ ] Live mode successfully spawns a real `claude` subprocess via the bridge and reflects its hook events in under 2 seconds of wall-clock lag
- [ ] DESIGN.md palette and typography are visibly applied — the UI looks *designed*, not defaulted
- [ ] No string in the codebase references any of the presenter's other projects by name
- [ ] Repo is deploy-ready: `vercel.json` and README present, `npm run build` succeeds — but no host is targeted by the build agent
- [ ] Responsive enough on mobile not to break (graph pannable, scenario bar collapses), but not mobile-tuned — this is a laptop/projector demo
- [ ] A 60-second screen recording captures: empty → paste URL → graph → click scenario → animated playback → click node → panel → close

---

## 3. Architecture

### Two deployment surfaces

**Surface 1 — Vercel (`agent-viz.vercel.app`)**
Purely static + serverless: Next.js App Router with one API route for the GitHub proxy. Always in **Demo mode**. Anyone can visit, paste a URL, and explore. This is what lives after the conference.

**Surface 2 — Local presenter laptop**
During the demo, `npm run dev` on the laptop + a tiny `bridge/` daemon on `localhost:4001`. Claude Code hooks POST event payloads to the bridge; the bridge forwards them over WebSocket to the running Next.js app. When the presenter clicks a scenario in **Live mode**, the bridge `fork`s `claude` as a subprocess with a pre-canned prompt.

```
┌──────────────────────────┐         ┌───────────────────┐
│ Browser                  │   WS    │ bridge (Node)     │
│ localhost:3000           │◄───────►│ localhost:4001    │
│ (Next.js dev)            │         │                   │
└──────────────────────────┘         └──┬────────────────┘
                                        │ fork            ▲
                                        ▼                 │
                                 ┌──────────────┐         │
                                 │ claude CLI   │──hooks──┘
                                 │ (subprocess) │   (curl POST /event)
                                 └──────────────┘
```

### Separation of concerns

| Layer | Surface 1 (Vercel) | Surface 2 (Local) |
|-------|--------------------|--------------------|
| Graph rendering | yes | yes |
| GitHub URL fetch | yes (API route) | yes |
| Scripted scenarios (Demo mode) | yes | yes |
| Live execution (Live mode) | no (disabled) | yes |
| Bridge daemon | N/A | required |
| Claude hooks | N/A | configured in `~/.claude/settings.json` |

### Mode detection

On mount, client pings `http://localhost:4001/health` with a 500ms timeout. If it responds, **Live** toggle becomes available; otherwise the UI shows Demo mode only with a tooltip explaining how to start the bridge.

---

## 4. Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16 (App Router) | Already scaffolded |
| Language | TypeScript (strict) | |
| Styling | Tailwind v4 + CSS tokens | Tokens in `globals.css`, per DESIGN.md |
| Graph | `@xyflow/react` | React Flow |
| Animation | `framer-motion` | |
| Markdown parse | `gray-matter` | YAML frontmatter only — body is kept raw |
| Icons | `lucide-react` | |
| Utility | `clsx`, `tailwind-merge` | |
| Fonts | Cinzel, Inter, JetBrains Mono | `next/font/google` |
| Bridge runtime | Node (no framework — raw `http` + `ws`) | Keep deps tiny |
| Deploy | Vercel | Default Next.js preset |

Deps already installed ✅

---

## 5. File Tree (target)

```
agent-viz/
├── app/
│   ├── layout.tsx                       # fonts, metadata, global shell
│   ├── page.tsx                         # main dashboard (client component)
│   ├── globals.css                      # design tokens + tailwind layers
│   └── api/
│       ├── fetch-repo/route.ts          # GitHub → Ecosystem JSON
│       └── run-scenario/route.ts        # proxy to bridge /run
├── components/
│   ├── shell/
│   │   ├── Header.tsx                   # logomark, mode toggle, repo loader trigger
│   │   ├── ScenarioBar.tsx              # 3 scenario buttons + mode indicator
│   │   └── StatusBar.tsx                # counts + live/idle dot
│   ├── graph/
│   │   ├── EcosystemGraph.tsx           # React Flow canvas + layout
│   │   ├── AgentNode.tsx                # circle node type
│   │   ├── SkillNode.tsx                # rounded-rect node type
│   │   ├── RuleNode.tsx                 # pill node type
│   │   ├── CanvasBackdrop.tsx           # circuit SVG + radial rings + stars
│   │   └── edgeStyles.ts                # edge config per kind
│   ├── panel/
│   │   ├── DetailPanel.tsx              # right-slide sheet
│   │   ├── AgentDetail.tsx
│   │   ├── SkillDetail.tsx
│   │   └── RuleDetail.tsx
│   ├── scenarios/
│   │   ├── ScenarioPlayer.tsx           # step runner
│   │   └── scripts.ts                   # 3 scenarios defined
│   ├── input/
│   │   └── RepoLoader.tsx               # URL input (modal), sample button, error surface
│   └── ui/
│       ├── Sheet.tsx                    # minimal slide-in panel primitive
│       ├── Button.tsx
│       └── Badge.tsx
├── lib/
│   ├── types.ts                         # Ecosystem, Agent, Skill, Rule, Edge
│   ├── parser/
│   │   ├── index.ts                     # buildEcosystem(files)
│   │   ├── parseAgent.ts
│   │   ├── parseSkill.ts
│   │   ├── parseRule.ts
│   │   └── deriveEdges.ts
│   ├── github.ts                        # listTree, fetchFile
│   ├── layout.ts                        # layered auto-layout (no dagre dep)
│   ├── bridge-client.ts                 # WS client for Live mode
│   └── cn.ts                            # clsx + tailwind-merge helper
├── public/
│   ├── sample-ecosystem.json            # fabricated demo dataset
│   ├── circuit-pattern.svg              # background motif
│   └── favicon.svg
├── bridge/
│   ├── server.js                        # ~200 LOC: http + ws + child_process
│   ├── scenarios.js                     # pre-canned prompts per scenario
│   ├── package.json
│   └── README.md                        # hook config snippet, start order
├── scripts/
│   └── demo-up.sh                       # starts bridge + dev server
├── DESIGN.md                            # ✅ already written
├── PLAN.md                              # ✅ this file
├── tasks/todo.md                        # ✅ checkable task list
├── README.md                            # public-facing, brandless
├── vercel.json
└── package.json
```

---

## 6. Data Model

Defined in `lib/types.ts`:

```ts
export type Model = 'opus' | 'sonnet' | 'haiku' | 'unknown';
export type Capability = 'read-only' | 'write' | 'mixed';

export interface Agent {
  id: string;                // filename without .md
  name: string;
  description: string;
  model: Model;
  tools: string[];
  disallowedTools: string[];
  maxTurns?: number;
  isolation?: 'worktree';
  memory?: 'project';
  capability: Capability;    // derived from disallowedTools + tools
  canSpawnAgents: boolean;   // tools includes 'Agent' OR body references subagent_type
  spawnTargets: string[];    // agent ids this agent can spawn
  promptBody: string;        // raw markdown body for the detail panel
}

export interface Skill {
  id: string;                // directory name
  name: string;              // same as id
  description: string;
  argumentHint: string;
  allowedTools: string[];
  spawnsAgents: string[];    // derived: allowed-tools + body grep
  body: string;
}

export interface Rule {
  id: string;
  name: string;
  scope: string;             // first line after frontmatter (the "Auto-loaded when..." hint)
  body: string;
}

export type EdgeKind =
  | 'skill-spawns-agent'
  | 'agent-spawns-agent'
  | 'agent-uses-rule';

export interface Edge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
}

export interface Ecosystem {
  agents: Agent[];
  skills: Skill[];
  rules: Rule[];
  edges: Edge[];
  meta: {
    sourceLabel: string;     // e.g. "sample" or "owner/repo"
    generatedAt: string;     // ISO
  };
}
```

### Derivation rules

- `capability`:
  - `read-only` if `disallowedTools` contains `Write`, `Edit`, or `NotebookEdit`
  - `write` if it has none of those and has at least one of them NOT disallowed
  - `mixed` otherwise (rare)
- `canSpawnAgents`:
  - true if `tools` literally contains `Agent`
  - OR body matches `/subagent_type:\s*['"](.+?)['"]/`
- `spawnTargets`: collected from `subagent_type:` body matches
- Skill `spawnsAgents`:
  - extracted from `allowed-tools` entries like `Agent(<name>)`
  - plus body scan for `Agent(...)` with a known agent name
- Edges:
  - one `skill-spawns-agent` per `(skill.id, agentId)` from `spawnsAgents`
  - one `agent-spawns-agent` per `(agent.id, targetId)` from `spawnTargets`
  - rule edges are not drawn by default (too noisy); shown only on a rule-filter toggle

---

## 7. Visual System

Defined entirely in [`DESIGN.md`](./DESIGN.md). Highlights for implementation:

- Two light sources: cyan-blue (technology) and gold (authority)
- Fonts: Cinzel (hero), Inter (body), JetBrains Mono (tool names)
- Void background `#02040E`, panel surface `#050914`
- Agent node = circle, ring color encodes capability (cyan read-only / gold write-capable)
- Skill node = pill, dashed cyan edges to agents
- Slow cinematic motion (280ms panel, 1200ms scenario pulse)
- Circuit tracery SVG background + radial pulse + sparse starlight points

---

## 8. Scenarios (finalized)

Three scripted + live-capable scenarios.

### S1 — Review a diff
**Narrative**: a proposed change enters the system; a reviewer examines it.
**Nodes**: `reviewer` (central)
**Script steps** (Demo mode):
1. Highlight `reviewer` node — "Reviewer starts"
2. Pulse `/doublecheck` skill (if present) or `reviewer` alone — "Runs adversarial checks"
3. Flash a "Verdict: approved" toast
**Duration**: ~6s
**Live prompt** (Mode B): `claude --agent reviewer -p "Review the diff in cwd and report findings"`

### S2 — Monthly strategy review
**Narrative**: three lead agents evaluate the system in parallel.
**Nodes**: `strategy-monthly` skill → `product-lead`, `tech-lead`, `growth-lead` (fan-out)
**Script steps**:
1. Highlight `/strategy-monthly` skill
2. Fan out edges simultaneously to 3 lead agents — all pulse together
3. Brief hold (1.5s)
4. Edges contract back to the skill — "Synthesized"
**Duration**: ~8s
**Live prompt**: `claude -p "/strategy-monthly"`

### S3 — Full development pipeline
**Narrative**: end-to-end feature delivery across an 8-agent pipeline — research, design, build, validate, gate, provision.
**Nodes**: `strategist` → `manager` → `tech-lead` → `developer` → `tester` → `reviewer` → `security-reviewer` → `architect` → `manager`
**Script steps**:
1. Highlight `strategist` — "Research & feature brief"
2. Edge to `manager` — "Decompose & assign"
3. Parallel edges to `tech-lead` + `developer` — "Design + scaffold" (short hold)
4. Edge to `tester` — "Validate"
5. Edge to `reviewer` — "Quality gate"
6. Edge to `security-reviewer` — "Security gate"
7. Edge to `architect` — "Provision follow-up artifacts"
8. Edge back to `manager` — "Ship PR"
**Duration**: ~16s
**Live prompt**: `claude --agent manager -p "Implement the trivial sample task in the demo directory, coordinating the full pipeline"` (pre-seeded demo dir with a trivial task that naturally triggers each pipeline stage)

---

## 9. Scenario Player Mechanics

### Demo mode (scripted)

`components/scenarios/scripts.ts` exports:

```ts
export interface Step {
  nodeIds: string[];      // which nodes to pulse
  edgeIds?: string[];     // which edges to trace
  durationMs: number;
  label?: string;         // status bar label during this step
}
export interface Scenario {
  id: 's1-review' | 's2-strategy' | 's3-pipeline';
  title: string;
  steps: Step[];
}
```

Runner uses `framer-motion` variants. Node active state is tracked in a single `activeNodeIds: Set<string>` React state; AgentNode / SkillNode read from a context. Edges check membership to decide animated stroke.

### Live mode (real)

- Client opens WebSocket to `ws://localhost:4001/ws`
- On scenario click, POST `http://localhost:4001/run` with `{ scenarioId }`
- Bridge spawns `claude` with the scenario's pre-canned prompt
- Claude's hooks POST event payloads to bridge's `/hook/*` endpoints
- Bridge broadcasts `{kind, payload}` events over WebSocket
- Client maps events → node/edge highlights:

```
Event kind                → UI reaction
─────────────────────────────────────────────────────────────
session_start             → scenario banner "Live session started"
pre_tool_use Task/Agent   → highlight target agent node (parse subagent_type)
subagent_stop             → fade highlight, advance to next
post_tool_use             → ticker log entry in status bar
session_end               → scenario complete toast
```

- If bridge times out (no events for 30s): auto-abort scenario and show toast "Live session stalled — try Demo mode"
- Fallback: if bridge unreachable at click time, toast + auto-switch to Demo mode

---

## 10. Bridge (Mode B)

### `bridge/server.js`

- Node 18+ with built-in `http`, `child_process`
- One dep: `ws` (WebSocket server)
- Endpoints:
  - `GET /health` — `{status:'ok', version}`
  - `POST /run` — body `{scenarioId}` → spawns `claude` subprocess, returns `{sessionId}`
  - `POST /hook/:kind` — body is raw JSON hook payload, broadcasts to WS clients
  - `POST /abort` — kills current subprocess
- WebSocket at `/ws` — broadcasts normalized event stream

### `bridge/scenarios.js`

Maps scenarioId → `{cwd, prompt, agent?, env?}`. Pre-seeds a demo working directory with a trivial test so Scenario S3 has something real to work on.

### Hook config (documented in `bridge/README.md`)

User adds to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{"hooks": [{"type": "command", "command": "curl -s -X POST http://localhost:4001/hook/session-start -H 'Content-Type: application/json' -d @-"}]}],
    "PreToolUse":    [{"hooks": [{"type": "command", "command": "curl -s -X POST http://localhost:4001/hook/pre-tool-use -H 'Content-Type: application/json' -d @-"}]}],
    "PostToolUse":   [{"hooks": [{"type": "command", "command": "curl -s -X POST http://localhost:4001/hook/post-tool-use -H 'Content-Type: application/json' -d @-"}]}],
    "SubagentStop":  [{"hooks": [{"type": "command", "command": "curl -s -X POST http://localhost:4001/hook/subagent-stop -H 'Content-Type: application/json' -d @-"}]}],
    "Stop":          [{"hooks": [{"type": "command", "command": "curl -s -X POST http://localhost:4001/hook/stop -H 'Content-Type: application/json' -d @-"}]}]
  }
}
```

Rollback snippet included in the bridge README.

### `scripts/demo-up.sh`

```
node bridge/server.js &
npm run dev
```

With a trap to kill the bridge on Ctrl-C.

---

## 11. GitHub URL Input

- Input accepts formats: `https://github.com/owner/repo`, `github.com/owner/repo`, `owner/repo`
- `POST /api/fetch-repo` with `{slug: "owner/repo"}`
- Server-side uses the GitHub REST API:
  1. `GET /repos/{owner}/{repo}/contents/.claude` — list directory
  2. Recursively fetch `.claude/agents/`, `.claude/skills/`, `.claude/rules/` via the tree API
  3. Fetch each file's raw content via the `download_url`
- Optional `GITHUB_TOKEN` env var raises rate limit from 60/hr to 5000/hr
- Parse server-side → return `Ecosystem` JSON
- Error envelope: `{error: 'no-claude-dir' | 'rate-limited' | 'private-repo' | 'unknown', message}`
- Client surfaces these inline under the input

---

## 12. Sample Ecosystem (fabricated)

`public/sample-ecosystem.json` contains a plausible-but-generic ecosystem used for the "Load sample" button. Naming uses archetype language that could appear in any engineering team:

- **Agents** (10): `strategist`, `manager`, `tech-lead`, `developer`, `tester`, `reviewer`, `security-reviewer`, `architect`, `product-lead`, `growth-lead` — these are generic engineering-team archetypes and do not resemble any specific internal project
- **Skills** (8): `plan`, `ship`, `audit`, `verify`, `brief`, `promote`, `strategy-monthly`, `strategy-weekly`
- **Rules** (3): `conventions`, `security-baseline`, `review-policy`

The three scenarios use these names. No resemblance to the presenter's other projects.

---

## 13. Implementation Phases

See [`tasks/todo.md`](./tasks/todo.md) for the checkable execution list.

Brief phases:
0. Plan + scaffold (this step)
1. Design tokens + layout shell (invoke `frontend-design` skill)
2. Parser + sample ecosystem
3. Graph render + node components (invoke `interface-guidelines`)
4. Detail panel
5. Scenario player (Demo mode)
6. GitHub URL input
7. Bridge + Live mode
8. Polish pass (invoke `design-polish`)
9. Local-run finalize (build check, README, `vercel.json`) — no deployment

---

## 14. Skills Used During Build

| Skill | Phase | Purpose |
|-------|-------|---------|
| `frontend-design` | 1 | Shell composition, header, typography hierarchy |
| `interface-guidelines` | 3, 4 | Node interaction patterns, focus states, panel a11y |
| `design-polish` | 8 | Final QA pass on spacing, motion, contrast |
| `design-review` | 8 | Accessibility + visual review of the deployed build |

---

## 15. Hosting — intentionally deferred

The app runs **locally** for the conference demo. No automatic deployment happens during the build. The repo ships **deploy-ready** (`vercel.json` present, `README.md` documents env vars and build commands) so the user can deploy manually at their own cadence — but the build agent does not push to any host, does not run `vercel`, and does not advertise a URL it hasn't verified.

The Live-mode architecture requires the bridge + `claude` CLI on the presenter's machine anyway, so a hosted URL is only useful for post-conference Demo-mode sharing. The presenter handles that step themselves when ready.

- Env vars on whichever host is eventually chosen (optional): `GITHUB_TOKEN` for higher rate limit.
- Custom domain: optional, out of scope for this build.

---

## 16. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Bridge fails on stage | medium | auto-fallback to Demo mode within 3s; pre-flight check in `demo-up.sh` |
| GitHub rate limit during live demo | medium | pre-warm sample; set `GITHUB_TOKEN` locally; sample-first default |
| `claude` live output is slow | high | narrate during waits; pick fast scenarios; S3 uses a pre-seeded tiny task |
| React Flow performance with 30+ nodes | low | our biggest ecosystem is ~25 nodes; R-F handles 100s trivially |
| Brand leak via copy-paste | low | grep-gate before commit: no `the-matrix`, no `trypix`, no `TRYPIX` anywhere |

---

## 17. Explicit Out-of-Scope

- Authoring / editing agents from the UI
- Persistence across page reloads
- User accounts, auth, rate-limit-per-user
- Multi-repo comparison
- Historical runs / past session replay from transcripts
- Deployment docs for the bridge beyond the conference laptop
- Mobile-first optimization (responsive enough to not break, not tuned)
- i18n (English only for the app UI; code in English)
