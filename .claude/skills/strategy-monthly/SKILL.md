---
description: Monthly strategy review — product/tech/growth leads do deep assessments, architect refresh
argument-hint: ""
allowed-tools: Read, Write, Edit, Agent(product-lead, tech-lead, growth-lead, architect)
---

# /strategy-monthly — Monthly Strategy Review

Deep (~15 minute) cross-functional review. Spawns three leads in parallel, then optionally the architect to refresh the ecosystem if strategy changed materially.

## What This Skill Does

1. **Spawn three leads in parallel** with full assessment briefs:
   - `product-lead` — priority shifts, kill criteria, pivot triggers
   - `tech-lead` — architecture drift, dependency hygiene, perf budget
   - `growth-lead` — channel performance, content cadence, post-conference shape
2. **Wait for all three** — each writes their assessment to `tasks/strategy/<role>-assessment-YYYY-MM-DD.md`
3. **Synthesize** into `tasks/monthly/monthly-YYYY-MM-DD.md` with consolidated recommendations
4. **Decide ecosystem refresh** — if any of:
   - Product recommends a new agent role
   - Tech flags an architectural shift requiring new conventions
   - Growth requires a new content channel with its own workflow
   then spawn `architect` with the monthly report as input
5. **Surface to user** — recommendations requiring approval (kill, pivot, paid promotion)

## When To Run

- First session of each calendar month
- More than 30 days since last `/strategy-monthly`
- After a production incident or major release
- Before starting a new multi-week feature

## Output Synthesis

```markdown
# Monthly Strategy Review — YYYY-MM

## Executive Summary
<5-7 sentences: where the product is, where it's going, what's blocking>

## Lead Findings
- **Product**: <link to product-assessment-YYYY-MM-DD.md> + 3-line summary
- **Tech**: <link>
- **Growth**: <link>

## Reconciled Priorities
<top 5 actions, ranked, owner assigned>

## Ecosystem Refresh Required?
<yes/no, rationale; if yes, architect spawn invoked>

## Open for User
<decisions requiring approval>
```
