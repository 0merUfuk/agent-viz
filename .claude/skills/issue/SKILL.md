---
description: File a structured GitHub issue from a finding, audit report, or user complaint
argument-hint: "<title> [-- <description>]"
allowed-tools: Read, Grep, Glob, mcp__plugin_github_github__list_issues, mcp__plugin_github_github__search_issues, mcp__plugin_github_github__add_issue_comment
---

# /issue — File GitHub Issue

Convert a finding into a well-scoped GitHub issue on `0merUfuk/agent-viz`. Always check for duplicates first.

## What This Skill Does

1. **Search for duplicates** via `search_issues` using keywords from the title; if a close match exists, comment on it instead of creating a new one
2. **Draft the issue body** with these sections:
   - Summary (1-2 sentences)
   - Steps to reproduce (numbered)
   - Expected vs. actual
   - Environment (Next.js version, browser, OS, reduced-motion preference)
   - Suggested fix or discussion (if any)
3. **Tag appropriately**: `bug` / `enhancement` / `docs` / `cinema` / `parser` / `presenter`
4. **File the issue** and return the URL

## Style

- Title is short and specific: `cinema HUD elapsed counter shows 00:00 after scenario restart` not `HUD broken`
- Body uses code fences for paths and error output
- Steps to reproduce are minimal — strip everything not necessary to trigger the bug
