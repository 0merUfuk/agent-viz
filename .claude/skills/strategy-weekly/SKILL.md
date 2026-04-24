---
description: Weekly health pulse — quick spawn of product/tech/growth leads in parallel
argument-hint: ""
allowed-tools: Read, Write, Agent(product-lead, tech-lead, growth-lead)
---

# /strategy-weekly — Weekly Health Pulse

Quick (~5 minute) cross-functional check during conference run-up. Spawns the three lead agents in parallel for a tight pulse, not a deep assessment.

## What This Skill Does

1. Spawn `product-lead`, `tech-lead`, `growth-lead` simultaneously with a "weekly pulse — under 10 lines each" brief
2. Wait for all three to return
3. Synthesize into a single report at `tasks/weekly/weekly-YYYY-MM-DD.md`
4. Highlight any divergence between leads (e.g., growth wants more scenarios; tech says we're at the perf ceiling)

## When To Run

- During an active conference sprint
- More than 7 days since last `/strategy-weekly`
- Skip if `/strategy-monthly` ran in the same week — too much overlap

## Output Format

```markdown
# Weekly Pulse — YYYY-MM-DD

## Product
<10 lines max>

## Tech
<10 lines max>

## Growth
<10 lines max>

## Tensions
<where the leads disagree, with one-line analysis>

## This Week's Focus
<single most important action item>
```
