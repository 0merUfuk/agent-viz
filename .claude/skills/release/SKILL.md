---
description: Cut a versioned release of agent-viz — bump, tag, push, deploy
argument-hint: "[major|minor|patch]"
allowed-tools: Read, Edit, Bash(git:*), Bash(npm:*)
---

# /release — Cut a Release

Cut a SemVer release of agent-viz. Versioning is informal during the conference run-up — every meaningful demo iteration earns a tag.

## What This Skill Does

1. Verify on `main` and clean (`git status` empty)
2. Read recent commits since last tag (`git log --oneline $(git describe --tags --abbrev=0)..HEAD`)
3. Determine bump type:
   - **major**: schema or route shape change that breaks /stage / / sync
   - **minor**: new scenario, new overlay, new agent, new skill
   - **patch**: bug fix, copy tweak, motion adjustment, doc update
4. Update `package.json` version
5. Update `CHANGELOG.md` with a dated section listing Added / Changed / Fixed
6. Commit: `chore: release vN.N.N`
7. Tag: `git tag -a vN.N.N -m "Release vN.N.N — <one-line summary>"`
8. Push: `git push && git push origin vN.N.N`
9. If Vercel is connected, deployment is automatic on push to `main`

## SemVer Decisions

| Change | Bump |
|--------|------|
| Add scenario, agent, skill, overlay | minor |
| Tweak scenario timing, copy, color | patch |
| Change `cinema-sync` channel name or `CinemaState` shape | major |
| Add new route | minor (additive); major (replaces existing) |

## Constraints

- Never tag work-in-progress; only meaningful, tested checkpoints
- Annotated tags only (`-a`); never lightweight
- Do not push tags by default with `git push --tags`; push the specific tag explicitly
