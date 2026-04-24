# agent-viz

> An interactive visualization of a Claude Code agent ecosystem. Paste any public GitHub repo containing a `.claude/` directory and see the agents, skills, and rules as a live graph — with scripted scenario playback and an optional local bridge for real-agent execution.

---

## What it does

- **Parses** any `.claude/agents/`, `.claude/skills/*/SKILL.md`, and `.claude/rules/` tree from a public GitHub URL.
- **Renders** the ecosystem as a layered graph: skills along the top, agents in the middle, rules as a bottom strip. Orchestrator skills get a gold accent; read-only agents get a cyan ring; write-capable agents get a gold ring.
- **Plays** three scripted scenarios end-to-end in Demo mode:
  - `s1-review` — a `/doublecheck` review handoff
  - `s2-strategy` — monthly strategy fan-out across product / tech / growth leads
  - `s3-pipeline` — an 8-agent autonomous dev pipeline
- **Streams** real agent execution in Live mode — when the local bridge is running, scenario clicks spawn a real `claude` CLI subprocess and the graph animates in response to `PreToolUse` / `SubagentStop` hook events.

---

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

On the empty canvas:
- Press **S** or click **Load sample** to explore the fabricated 10-agent / 8-skill / 3-rule dataset.
- Click **Load repo** and paste any public GitHub URL that contains a `.claude/` directory.

### GitHub token (recommended)

Unauthenticated GitHub requests are rate-limited to 60/hour, which is tight for development. Set `GITHUB_TOKEN` to a classic PAT with `public_repo` scope:

```bash
export GITHUB_TOKEN=ghp_your_token_here
npm run dev
```

The token lives only on the server; it is never sent to the browser.

---

## Live mode (optional)

LIVE mode is optional — DEMO mode is the default for conferences. To enable LIVE, run the bridge alongside Next.js:

```bash
npm run bridge:install   # one-time, installs ws into bridge/
npm run dev:live         # starts Next.js (:3000) and the bridge (:4001) together
```

The bridge listens on `localhost:4001` and ferries Claude Code lifecycle hooks (`PreToolUse`, `SubagentStop`, …) into the cinema graph. Once it is reachable, the **Live** toggle in the header activates. Click a scenario and the bridge forks `claude` with a pre-canned prompt.

Hook configuration in `~/.claude/settings.json`, rollback steps, and the full API shape live in [`bridge/README.md`](./bridge/README.md).

**Requirements:** Node 18+, `claude` CLI on `PATH`.

---

## Project tree

```
agent-viz/
├── app/                          # Next.js App Router
│   ├── api/fetch-repo/           # GitHub proxy (Node runtime)
│   ├── icon.svg                  # favicon
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css               # design tokens, typography, keyframes
│
├── bridge/                       # local Node daemon for Live mode
│   ├── server.js                 # HTTP + WebSocket on 127.0.0.1:4001
│   ├── scenarios.js              # scenarioId → { cwd, prompt, agent }
│   ├── demo-cwd/                 # pre-seeded project for s3-pipeline
│   └── README.md                 # hook config + rollback
│
├── components/
│   ├── graph/                    # React Flow canvas, node types, backdrop
│   ├── panel/                    # detail panel for agents/skills/rules
│   ├── scenarios/                # scripted player + live player
│   ├── shell/                    # header, scenario bar, status bar
│   ├── input/                    # repo loader modal
│   └── ui/                       # Button, Badge, Sheet, Toast
│
├── lib/
│   ├── parser/                   # frontmatter → Ecosystem
│   ├── layout.ts                 # layered graph layout
│   ├── github.ts                 # slug parse + recursive fetch
│   ├── bridge-client.ts          # WebSocket client
│   └── types.ts                  # Ecosystem, Agent, Skill, Rule, Edge
│
├── public/
│   ├── sample-ecosystem.json     # fabricated dataset
│   └── circuit-pattern.svg       # canvas backdrop tile
│
└── scripts/
    └── demo-up.sh                # bridge + dev server launcher
```

---

## Tech

- Next.js 16 (App Router, Turbopack, TypeScript strict)
- Tailwind v4 with `@theme inline`
- React Flow (`@xyflow/react`) for the canvas
- Framer Motion for the detail panel and toast
- `gray-matter` for YAML frontmatter parsing
- `ws` as the bridge's only runtime dependency

---

## Scripts

| Command                       | What it does                                          |
| ----------------------------- | ----------------------------------------------------- |
| `npm run dev`                 | Next.js dev server on `:3000`                         |
| `npm run dev:live`            | Next.js (`:3000`) and bridge (`:4001`) together       |
| `npm run bridge:install`      | one-time install for the bridge's `ws` dependency     |
| `npm run bridge:start`        | bridge only (assumes deps installed)                  |
| `npm run build`               | production build (static + one serverless route)      |
| `npm run start`               | serve the production build                            |
| `npm run lint`                | ESLint                                                |
| `bash scripts/demo-up.sh`     | legacy launcher — same idea, predates `dev:live`      |

---

## Deploying

The repo ships deploy-ready for Vercel (`vercel.json` included, Next.js preset). Set `GITHUB_TOKEN` in the project's environment variables before deploying if you expect more than casual traffic — otherwise the API route will hit GitHub's 60/hour anonymous rate limit.

Live mode is **local-only** by design — the bridge spawns processes on the host and therefore is not exposed to the public web build.

---

## License

MIT — see [LICENSE](./LICENSE).
