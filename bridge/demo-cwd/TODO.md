# Trivial demo task

Pre-seeded for agent-viz Live-mode scenario S3.

## Task

Implement a function `capitalize(s string) string` in `capitalize.go` that
returns the input with the first letter uppercased. Handle the empty-string
case by returning an empty string.

## Acceptance criteria

- Function signature exactly: `func Capitalize(s string) string`
- Empty input returns `""`
- Single-character input returns that character uppercased
- Multi-character input uppercases only the first rune
- A simple test in `capitalize_test.go` covers all three cases

This task is intentionally trivial so the full agent pipeline
(strategist → manager → tech-lead → developer → tester → reviewer →
security-reviewer → architect → manager) completes quickly during the demo.
