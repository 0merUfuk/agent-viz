**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# agent-viz — Known Issues

> Append issues as they are discovered. Mark resolved with ✅ and the resolving PR / commit.

---

## Open

### I-001 — Skill-spawns-skill edges not derived

**Severity:** minor
**Surface:** `lib/parser/`

The parser derives skill → agent edges from `Agent(...)` entries in `allowed-tools`, but a skill that delegates to another skill (e.g., `/fix` invoking `/doublecheck`) is not represented as a graph edge. Visualization shows the two skills as disconnected.

**Workaround:** Document inter-skill dependencies in skill bodies; audiences can read overlays.

---

### I-002 — Branch toggle missing in RepoLoader

**Severity:** minor
**Surface:** `components/input/RepoLoader.tsx`

RepoLoader always parses the default branch. Repos publishing `.claude/` only on a feature branch cannot be loaded.

**Workaround:** None. Authors should ship `.claude/` on default branch.

---

### I-003 — Scenario boundary flash

**Severity:** minor
**Surface:** `components/cinema/`

Switching scenarios mid-playback can briefly render the previous scenario's last verdict before the new arc begins.

**Workaround:** Wait for verdict to clear before switching scenarios live.

---

## Resolved

*(none yet — see git log for fixes that pre-date this file)*
