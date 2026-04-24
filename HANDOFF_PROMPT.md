# agent-viz — Execution Handoff Prompt

> Copy everything below the horizontal rule into a fresh Claude Code session (opened in `~/repos/agent-viz`). The prompt is self-contained. Do not add the heading above.

---

You are taking over a fully scoped greenfield Next.js project at `~/repos/agent-viz`. The plan, visual system, and checklist are already on disk. Your job is to execute Phases 1–9 end-to-end in a single pass, with minimal questions, and deploy the result. This is a conference-demo app, not production-critical software — ship it, don't gold-plate it.

## 1. Situational awareness — read these first, in order

1. `PLAN.md` — full project plan, 17 sections. Sections 3 (architecture), 6 (data model), 8 (scenarios), 9 (scenario player), 10 (bridge), 11 (GitHub input) are the technical spine.
2. `DESIGN.md` — visual system. Sections 2 (colors), 3 (typography), 7 (node styling), 10 (layout composition) are the execution-critical parts. **The UI must visibly reflect this design — not look like a defaulted Tailwind site.**
3. `tasks/todo.md` — 9-phase checklist with per-phase deliverables. Use it as your execution queue. Check items as you finish them and commit the todo file with updates alongside each phase's commit.
4. `package.json` — already has all required dependencies: `next` 16, `react` 19, `@xyflow/react`, `framer-motion`, `gray-matter`, `lucide-react`, `clsx`, `tailwind-merge`, Tailwind v4.

If any of those files are missing or contradict each other, stop and ask. Otherwise, proceed.

## 2. Mission

Build `agent-viz`: a Next.js App Router web app that parses a `.claude/` directory (agents, skills, rules in markdown with YAML frontmatter) and visualizes it as an interactive graph with:

- **Demo mode** (default, Vercel-hostable): scripted animated scenarios.
- **Live mode** (local-only, via a separate `bridge/` Node daemon): button click actually spawns `claude` CLI on the presenter's laptop and the graph animates from real hook events.

Three scenarios must work end-to-end in both modes: `s1-review`, `s2-strategy`, `s3-pipeline`. Scenario S3 is an 8-agent pipeline: `strategist → manager → tech-lead → developer → tester → reviewer → security-reviewer → architect → manager`.

## 3. Non-negotiable constraints

1. **Brand safety**: no string `the-matrix`, `trypix`, `TRYPIX`, `mythix`, `heimdall`, `trypixai`, or any other non-generic internal project name in any file — source, comments, commits, docs. Before every commit, run:
   ```bash
   ! grep -rEi "the-matrix|trypix|mythix|heimdall" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next .
   ```
   If it prints anything, fix before committing.
2. **Design fidelity**: the build is judged on whether it looks like it came from the conference key art. If a screen looks generically Tailwind-ish, that's a failure. Invoke the design skills listed in §5 at the specified phases — don't skip them.
3. **No partial phases pushed to main**: a phase commits and pushes only when its `tasks/todo.md` checkmarks are all green.
4. **Commit = one phase**: conventional commit format, message body lists what shipped. Commit template in §7.
5. **Do not rename or relocate files already on disk** (`DESIGN.md`, `PLAN.md`, `tasks/todo.md`). You may edit them (e.g., checking off todo items) but the paths stay.

## 4. Execution order

Execute phases strictly in order. Each phase ends with: update `tasks/todo.md` → commit → push to `origin/main`.

| Phase | Title | Primary deliverable |
|-------|-------|---------------------|
| 1 | Design tokens & shell | `globals.css`, fonts, header, scenario bar, status bar — app shell renders correctly at `npm run dev` |
| 2 | Parser & sample data | `lib/parser/*`, `lib/types.ts`, `public/sample-ecosystem.json` |
| 3 | Graph rendering | React Flow canvas with agent/skill/rule nodes, backdrop, edges |
| 4 | Detail panel | Right-slide sheet with per-kind detail components |
| 5 | Scenario player (Demo mode) | 3 working scripted playbacks |
| 6 | GitHub URL input | Working proxy route + modal loader |
| 7 | Live mode bridge | `bridge/` daemon, WS client, mode detection, hook config docs |
| 8 | Polish | a11y, motion, spacing, error states, responsive |
| 9 | Local-run finalize + README | `npm run build` passes, `vercel.json` + README ready, grep-gate pass. No deployment attempted. |

Per-phase full acceptance criteria are in `tasks/todo.md`. Read the relevant phase's checklist before starting it.

## 5. Skill invocation

Use the available Skill tool to invoke these at the specified phases. If the skill is not available in your environment, proceed without it but hold yourself to the same quality bar.

| Phase | Skill | When in the phase |
|-------|-------|-------------------|
| 1 | `frontend-design` | Before writing components — set the direction for shell composition, typography hierarchy, header anatomy |
| 3 | `interface-guidelines` | Before writing `EcosystemGraph.tsx` — lock interaction patterns (hover, focus, selection), keyboard nav |
| 4 | `interface-guidelines` | Before writing `DetailPanel.tsx` — slide-in a11y, focus trap, escape handling |
| 8 | `design-polish` | First pass of Phase 8 — final spacing, motion, contrast sweep |
| 8 | `design-review` | Last pass of Phase 8 — accessibility + visual audit |

## 6. Key technical decisions (already made — do not re-decide)

- **Fonts** via `next/font/google` in `app/layout.tsx`: Cinzel (600/700), Orbitron (500/700), Inter (400/500/600), JetBrains Mono (400/500). Expose as CSS variables `--font-cinzel`, `--font-orbitron`, `--font-sans`, `--font-mono`.
- **Color tokens** defined in `app/globals.css` under `:root` (see `DESIGN.md` §2 for the exact hex values and names). Expose under `@theme inline` for Tailwind v4 so you can use `bg-[var(--void)]` or custom utilities.
- **No src dir**. App Router. TypeScript strict is on by default.
- **Layout algorithm**: hand-rolled layered layout in `lib/layout.ts`. Do not add `dagre` as a dependency. Skills top row, agents middle (wrap to two rows if >8), rules as a bottom strip. Horizontal spacing weighted by connection count.
- **Bridge**: plain Node `http` + `ws` (one dep). Runs on `localhost:4001`. Endpoints `/health`, `/run`, `/abort`, `/hook/:kind`, WS at `/ws`. Pre-canned scenario prompts in `bridge/scenarios.js`. A pre-seeded `bridge/demo-cwd/` holds a trivial task for S3.
- **Hook integration**: user edits `~/.claude/settings.json` to add `curl -s -X POST http://localhost:4001/hook/<kind> -H 'Content-Type: application/json' -d @-` for each hook type. Rollback snippet included in `bridge/README.md`.
- **Mode detection**: client probes `http://localhost:4001/health` with 500ms timeout on mount. If reachable → Live mode available; else Demo only.
- **GitHub input formats**: accept `owner/repo`, `github.com/owner/repo`, full HTTPS URL. Normalize in `lib/github.ts`.
- **GitHub fetching**: use REST Contents API — `GET /repos/{owner}/{repo}/contents/.claude/agents`, `.claude/skills`, `.claude/rules` — then each file's `download_url`. Optional `GITHUB_TOKEN` env var raises rate limit.
- **Error envelope** from `/api/fetch-repo`: `{ error: 'no-claude-dir' | 'rate-limited' | 'private-repo' | 'unknown', message }`.
- **Scripted scenarios** are in `components/scenarios/scripts.ts`, typed per `PLAN.md §9`. Runner emits `activeNodeIds` + `activeEdgeIds` via React context; nodes read and pulse.
- **Reduced motion**: honor `prefers-reduced-motion: reduce` — replace tweens with instant state changes.

## 7. Commit & push rules

- Conventional commit format. One commit per phase.
- Commit message body lists the ≤5 most material changes.
- After each commit: `git push origin main`.
- Template for the commit message:
  ```
  <type>(<scope>): <summary line — imperative, ≤72 chars>

  <2–4 line body describing what shipped and why>

  Phase <N>/9 complete. See tasks/todo.md.
  ```
- Exact type/scope per phase (already planned in `tasks/todo.md`):
  1. `feat(shell): design tokens, layout, header, scenario bar`
  2. `feat(parser): ecosystem schema and markdown parser`
  3. `feat(graph): React Flow canvas with custom node types`
  4. `feat(panel): detail panel for agents, skills, rules`
  5. `feat(scenarios): scripted player with three scenarios`
  6. `feat(input): GitHub URL loader with API proxy`
  7. `feat(bridge): local daemon for live mode`
  8. `chore(polish): spacing, contrast, a11y, error states`
  9. `chore(finalize): vercel config, README, build verification`

## 8. Acceptance criteria (before Phase 9 commits)

From `PLAN.md §2`, all must be true:

- [ ] Empty-state-first load: blank canvas with URL input + "Load sample" button
- [ ] Pasting a valid public GitHub URL with `.claude/` renders the graph in under 5 seconds
- [ ] Clicking any node opens a detail panel with the correct parsed metadata
- [ ] All three scenarios play end-to-end without breaking in Demo mode
- [ ] Live mode, when bridge is running locally, spawns `claude` and reflects hook events within 2s of wall-clock lag (code path exists even if not smoke-tested without a real Claude session)
- [ ] DESIGN.md palette and typography are visibly applied
- [ ] Brand-safety grep (§3.1) prints nothing
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` serves the app without console errors
- [ ] `vercel.json` + README exist, but no deployment has been attempted

## 9. Local-run finalization (Phase 9)

The app runs **locally** for the conference demo. Do **not** attempt any deployment. Do **not** run `vercel`, `vercel --prod`, or any equivalent. Do **not** invent or suggest a deployed URL.

1. `npm run build` must pass with zero errors (build-time type errors, lint errors, and missing-module errors all count).
2. `npm run dev` must start without console errors and serve the app at `http://localhost:3000`.
3. Write `vercel.json` at repo root — Next.js preset, env-var hint for `GITHUB_TOKEN`. This makes the repo deploy-ready for the user's own manual deploy later; the agent does not trigger the deploy.
4. Write `README.md` — brandless, public-facing. Required sections:
   - One-paragraph what-it-is
   - **Quickstart** — `npm install && npm run dev`
   - **Live-mode demo** — one paragraph pointing at `bridge/README.md` for hook config and `scripts/demo-up.sh` for one-command startup
   - **Configuration** — the `GITHUB_TOKEN` env var (optional, raises rate limit)
   - **Project structure** — tree diagram of top-level folders
   - Short license note (MIT)
   - Do **not** include a "Deploy to Vercel" button; the user will handle hosting themselves.
5. Verify the brand-safety grep (§3.1) passes one last time.
6. Final commit + push, then stop.

## 10. When you are done

Output a single summary message with:

- ✅ phases completed
- 📦 file count added (rough, via `git diff --stat main~9 main | tail -1`)
- 🎬 how to run locally (`npm install && npm run dev`)
- 🎥 how to run the live demo (`scripts/demo-up.sh` after hook config in `bridge/README.md`)
- ⚠️ any compromises, known gaps, or things the user must verify in person (e.g., `claude` CLI must be on PATH for Live mode; any scenario that couldn't be smoke-tested without a real Claude session)

Then stop. Do not start new work. Do not deploy.

## 11. If things go wrong

- **Dependency conflict**: stop; report the error and proposed resolution.
- **React Flow v13 API has changed**: `@xyflow/react` is the current name; check the installed version in `package-lock.json` and use its API. Do not downgrade without reporting first.
- **Design skill unavailable**: proceed without it but state so in the final summary.
- **Bridge + Claude CLI integration can't be validated locally** (e.g., no `claude` binary): implement the code path, document the test gap in the final summary, do **not** skip writing the bridge.
- **GitHub rate limit during testing**: use the sample ecosystem; document.

Escalate to the user (stop and ask) **only** when:
- A file listed in PLAN.md §5 has a clear conflict with a design decision in DESIGN.md.
- A dependency is missing and adding it would change the architecture.
- The brand-safety grep finds something unexpected that you can't unilaterally remove.

Everything else: make the reasonable call and keep going.

## 12. One-line summary of what you're building

*A cinematic dark-themed dashboard that parses any `.claude/` directory into an interactive agent-orchestration graph, plays scripted scenarios for conference demos, and optionally streams real local agent execution over WebSocket — visual system derived from a gold-and-cyan sci-fi key art.*

Good luck. Ship it.
