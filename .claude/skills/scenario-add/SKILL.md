---
description: Author a new cinema scenario — timeline events, step pulses, DESIGN.md update
argument-hint: "<scenario-id> -- <one-line concept>"
allowed-tools: Read, Edit, Grep, Agent(strategist, developer, tester, reviewer)
---

# /scenario-add — Add a Cinema Scenario

End-to-end pipeline for authoring a new scenario in `components/scenarios/scripts.ts`. Coordinates the strategist (concept), developer (implementation), tester (timing assertions), and reviewer (pacing quality gate).

## What This Skill Does

1. **Strategist drafts the arc**:
   - Title (≤ 30 chars), subtitle (≤ 50 chars)
   - Step list with `nodeIds` and `durationMs`
   - Timeline events with absolute `at` offsets (relative ms from scenario start)
   - Total duration in 30-60s range — see DESIGN.md §17 for pacing guidance
   - Verdict event at the end (kind: `verdict`, with tone)
2. **Developer implements** in `components/scenarios/scripts.ts`:
   - Adds `ScenarioId` union member
   - Appends scenario object to `SCENARIOS`
   - Verifies `npm run build` clean
3. **Developer adds the scenario card** in `app/stage/page.tsx`:
   - Title + subtitle render in the scenario grid
   - Step previews populate
4. **Tester** adds timing assertions:
   - Sum of `step.durationMs` ≥ last `timeline[].at`
   - Verdict event present and last
   - All `from` / `to` agent ids exist in `sample-ecosystem.json`
5. **Reviewer** runs against DESIGN.md §17 authoring guidance:
   - Real Claude Code tool names (Read, Edit, Bash, Grep, Agent, WebSearch, WebFetch)
   - Real `.claude/agents/*` names for `from` / `to`
   - Pacing: handoffs every 2-4s, tool events every 0.8-1.5s during active work
   - Content lines ≤ 80 chars

## Constraints

- Run from a feature branch named `feat/scenario-<id>`
- Brand-safety check (`scripts/check-brand.sh`) must pass — content is part of the marketing surface
- Don't modify existing scenarios in this skill — create a separate `feat/scenario-<id>-tune` branch for tuning
- `EventStreamProvider`'s 35% reduced-motion compression applies automatically — no scenario-level work needed
