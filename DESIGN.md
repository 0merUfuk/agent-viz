**Version**: 1.1
**Created**: 2026-04-24
**Last Updated**: 2026-04-24
**Authors**: Ömer Ufuk

---

# agent-viz — Design System

> Visual language derived from the conference key art: classical Roman-serif lettering with a circuit-tracery interior, luminous cyan-blue glows over a deep navy void, and metallic gold highlights. Translated into a technical interface: cinematic, quiet, high-contrast, information-dense at the center and dark at the edges.

---

## 1. Visual Principles

1. **Void-first**: the canvas is near-black; everything else is light that *emerges* from it. No grey backgrounds. No soft pastels.
2. **Two-light-source palette**: every surface is lit either by **cyan-blue** (technology, circuitry, data) or **gold** (authority, hero text, achievement). Never mix them within a single element — they meet at the composition level.
3. **Sharp geometry, soft light**: edges are crisp (1px, square corners on panels), but the glows around them are wide and slow-falloff.
4. **Center-axis gravity**: composition pulls toward the center, mirroring the logo. The graph canvas has a radial pulse pattern anchored to the origin.
5. **Type does the talking**: serif for identity (headline, section titles, agent names), sans for information, mono for code. Never mix serif + gold + glow in the same element with any other treatment — that's reserved for the headline.

---

## 2. Color Tokens

All declared as CSS variables in `app/globals.css` under `:root`.

### Surface
| Token | Hex | Use |
|-------|-----|-----|
| `--void` | `#02040E` | Page background, graph canvas |
| `--abyss` | `#050914` | Panels, cards |
| `--surface` | `#0A0F1F` | Elevated panels, hover states |
| `--surface-hi` | `#121A33` | Active/selected surface |
| `--border-subtle` | `#1A2137` | Panel borders |
| `--border-active` | `#2A3558` | Hovered/focused borders |

### Cyan-blue (technology)
| Token | Hex | Use |
|-------|-----|-----|
| `--blue-deep` | `#1E3A8A` | Low-key fill, badges |
| `--blue` | `#3B82F6` | Primary interactive, edges |
| `--blue-bright` | `#60A5FA` | Hover, node glow |
| `--blue-star` | `#93C5FD` | Focus, starlight accents |
| `--blue-glow` | `rgba(96, 165, 250, 0.35)` | Outer glow filter |

### Gold (authority)
| Token | Hex | Use |
|-------|-----|-----|
| `--gold-deep` | `#8A6A1E` | Shadow side of gold gradient |
| `--gold` | `#D4AF37` | Hero text, model-opus badge |
| `--gold-bright` | `#E8C970` | Hover gold, highlights |
| `--gold-glow` | `rgba(232, 201, 112, 0.30)` | Outer glow on hero elements |

### Text
| Token | Hex | Use |
|-------|-----|-----|
| `--text` | `#E8EEFA` | Primary body text |
| `--text-muted` | `#8591AE` | Secondary text, metadata |
| `--text-dim` | `#4A5578` | Placeholders, disabled |

### Semantic
| Token | Hex | Use |
|-------|-----|-----|
| `--read-only` | `#60A5FA` | Read-only agents (cool cyan) |
| `--write-capable` | `#E8C970` | Write-capable agents (warm gold) |
| `--success` | `#4ADE80` | Completed scenario step |
| `--live` | `#F472B6` | Live-mode running indicator |

---

## 3. Typography

Four families, each with a single job. No other fonts.

| Family | Source | Use | Weight |
|--------|--------|-----|--------|
| **Cinzel** | Google Fonts | Logomark, agent name in detail panel, any hero serif text | 600, 700 |
| **Orbitron** | Google Fonts | Tracked uppercase display — scenario titles, section headlines, status labels | 500, 700 |
| **Inter** | Google Fonts | Body prose, UI labels, metadata, form inputs | 400, 500, 600 |
| **JetBrains Mono** | Google Fonts | Tool names, skill `/slash-names`, file paths, code | 400, 500 |

### Two-tier display rule (from key art)

Uppercase tracked display text (Orbitron) appears in exactly two colors, carrying semantic weight:

- **Cyan tier** (`var(--blue-bright)`) — infrastructure / technology / *how*. Examples: `SKILLS`, `AGENTS`, `LIVE MODE`, scenario subtitles like `"PIPELINE EXECUTION"`.
- **Gold tier** (`var(--gold)`) — outcome / authority / *what matters*. Examples: scenario titles like `"FULL DEV PIPELINE"`, "STRATEGY REVIEW", status bar "READY" / "COMPLETE".

Never combine the two colors in a single label. The tier choice is the message.

### Type Scale

| Token | Size | Line | Tracking | Use |
|-------|------|------|----------|-----|
| `text-hero` | 48px | 1.1 | 0.02em | Cinzel — logomark on landing |
| `text-display` | 20px | 1.2 | 0.12em | Orbitron — scenario titles (gold), section headers (cyan) |
| `text-display-sm` | 13px | 1.2 | 0.18em | Orbitron — status labels, node category tags |
| `text-title` | 22px | 1.3 | 0.02em | Cinzel — panel titles (agent name in detail) |
| `text-body` | 14px | 1.55 | 0 | Inter — all prose |
| `text-label` | 12px | 1.4 | 0.02em | Inter 500 — UI labels, badges |
| `text-mono-sm` | 12px | 1.5 | 0 | JetBrains Mono — small code, tool chips |
| `text-mono` | 13px | 1.6 | 0 | JetBrains Mono — code blocks, prompt bodies |

Letter-spacing on Cinzel: `0.02em` default. Letter-spacing on Orbitron: always `0.12em` or more, **never** below `0.08em` — tight Orbitron looks broken.

---

## 4. Motif: Circuit Tracery

The logo's interior circuitry becomes a **repeating SVG background pattern** on the graph canvas — very low opacity (4–6%), scaled large, positioned behind everything. It defines the "this is the substrate" feeling without competing with data.

- File: `public/circuit-pattern.svg`
- Tile size: 240 × 240px
- Stroke: `var(--blue-deep)` at 0.5px
- Nodes: occasional 2px dots at intersections

---

## 5. Motif: Parallax Space Backdrop

The canvas behind the graph is a **five-layer parallax system**, each layer GPU-transformed only (`translate3d`, `rotate`, `opacity`) — no reflow, no paint storms. All layers compress to near-instant under `prefers-reduced-motion`.

| Layer | Content | Motion |
|------|---------|--------|
| **L1 — Nebula** | Two very large soft radial gradients: one cyan (`var(--blue-glow)`) top-left, one gold (`var(--gold-glow)`) bottom-right, each at 25% opacity, blurred | Slow pan (60s loop), opposite directions |
| **L2 — Starfield** | 120 procedurally placed stars via `mulberry32` seeded PRNG, three brightness tiers, 90% cyan-white / 10% gold in lower-right quadrant | Individual twinkle: phase-offset opacity pulse, 3–8s per star |
| **L3 — Orbital rings** | 3 concentric elliptical rings, dashed 2 4, 1px stroke in `var(--blue-deep)` at 15–22% opacity | Slow rotations at 40s / 80s / 120s, each direction alternating |
| **L4 — Circuit pattern** | Existing `public/circuit-pattern.svg` tiled, 6% opacity | Diagonal drift, 180s loop |
| **L5 — Shooting stars** | Single faint gold streak that crosses the canvas every 25–40s, randomized angle, 1.2s traverse | Position/angle reset every iteration |

Layer order (back to front): L1 → L2 → L3 → L4 → L5 → graph. Selection highlight and scenario-active effects paint **on top of** L5 in the graph layer.

---

## 6. Motif: Starlight Points

Decorative 1–2px bright points scattered around the graph periphery at low density (~8 per 1000px²), each with a small bloom filter. Three brightness tiers so they don't read as uniform noise.

**Warm/cool mix** (from key art): 90% of stars are cool cyan-white (`var(--blue-star)`), 10% are warm amber (`#F5B041`) — matches the amber counterpoints in the bottom-right of the conference key art. The amber stars go in the lower-right quadrant exclusively.

---

## 6b. Motif: Code Texture

Very-low-opacity (4–6%) layer of tiny JetBrains Mono fragments scattered across the canvas — not decorative shapes, actual character strings like `0xA3FC`, `RADCORE:3`, `ln:42`, `OK.`. Inspired by the floating hex text in the key art's background. Static, non-interactive, positioned absolute below the graph layer. Generator: a single `.tsx` component that renders ~40 fragments at pre-computed positions (seeded, so layout is deterministic).

---

## 7. Node Styling

### Agent nodes (circles)
- 72px diameter
- Inner fill: `var(--abyss)` with a subtle inner glow ring matching the agent's capability
- **Read-only agent**: 1px ring, `var(--blue-bright)`
- **Write-capable agent**: 1px ring, `var(--gold-bright)`
- Outer glow on hover: 24px blur, color-matched
- Center: model badge (O/S/H) in Cinzel small-caps gold for Opus, cyan for Sonnet, muted for Haiku
- Name label below, 12px Inter medium, `var(--text)`, 1.4 line height

### Skill nodes (rounded rectangles)
- 160 × 44px
- Border: 1px `var(--border-subtle)`, becomes `var(--blue)` on hover
- Fill: `var(--abyss)`
- Label: `/{name}` in JetBrains Mono 13px, `var(--blue-bright)`
- Small subtitle in Inter 11px, `var(--text-muted)`
- Left edge: 2px gold bar if the skill spawns agents (orchestrator skill), else cyan

### Rule nodes (pills)
- Height 28px, padding 12px horizontal
- Fill: transparent
- Border: 1px dashed `var(--border-subtle)`
- Label: Inter 11px uppercase tracked, `var(--text-muted)`

### Edges
- **skill-spawns-agent**: dashed, 1.5px, `var(--blue)`, `stroke-dasharray: 4 3`
- **agent-spawns-agent**: solid, 1.5px, `var(--blue-bright)`
- **agent-uses-rule**: dotted, 1px, `var(--text-dim)`

---

## 8. Panels & Surfaces

- 1px border, square corners (radius: 0 on outer, 2 on inner elements)
- Background: `var(--abyss)`
- Optional 1px top border highlight in `var(--blue-deep)` for "backlit" feel
- Max-width for detail panel: 480px
- Slide-in from right with 280ms cubic-bezier(0.22, 1, 0.36, 1)

---

## 9. Motion

### Core motion tokens

| Kind | Duration | Easing |
|------|----------|--------|
| Panel slide-in | 280ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Node hover glow | 180ms | `ease-out` |
| Scenario step pulse | 1200ms (per step) | custom keyframe: scale 1 → 1.08 → 1 + glow fade |
| Edge trace | 900ms | `ease-in-out`, stroke-dashoffset animation |
| Selection lock-on | 420ms | `ease-out`, outer ring scales 1.35 → 1.0 and fades out; same animation doubles as panel-open flare since panel opens on selection |
| Scenario button hover trace | 1400ms infinite (hover only, presenter) | `linear`, cyan hotspot sweeps around the button outline |
| Running state-dot glow | 1800ms infinite (while `running`) | `ease-in-out`, red ring expands 0 → 5px and fades |

### Ambient motion tokens

These loop continuously and belong to the space/atmosphere layer, not to interaction feedback.

| Kind | Duration | Easing |
|------|----------|--------|
| Nebula pan | 60000ms infinite | `linear` |
| Star twinkle | 3000–8000ms infinite | `ease-in-out`, random phase |
| Orbit slow / med / fast | 120000 / 80000 / 40000ms infinite | `linear` |
| Circuit drift | 180000ms infinite | `linear` |
| Shooting star | 1200ms + 25–40s pause | `ease-out` |
| Header hairline sweep | 8000ms infinite | `ease-in-out`, gradient hotspot travels left→right |
| Portal button breath | 4000ms infinite | `ease-in-out`, border opacity + glow intensity breathe |
| Portal button flare | 420ms on hover | `ease-out`, gold ring expands outward and fades |

No bouncy springs anywhere. Motion is confident and slow — this is a cinematic interface, not a toy. All ambient motion drops to static frames under `prefers-reduced-motion`.

---

## 10. Layout Composition

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  [logomark]  agent-viz                 [mode toggle] [repo]  │  64px
├─────────────────────────────────────────────────────────────┤
│  SCENARIO BAR                                                │
│  ▶ Review a diff   ▶ Strategy review   ▶ Dev pipeline        │  56px
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                   GRAPH CANVAS                               │  flex-1
│              (React Flow + pulse + stars)                    │
│                                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  STATUS BAR                                                  │
│  ○ Idle   ·   10 agents  ·  8 skills  ·  3 rules             │  32px
└─────────────────────────────────────────────────────────────┘
```

Detail panel slides in from right, 480px wide, overlaying the graph.

---

## 11. Logomark

`agent-viz` wordmark in Cinzel 700, tracked letter-spacing `0.04em`, **lowercase**. Gold gradient on `agent` (top `var(--gold-bright)` → bottom `var(--gold-deep)`), `var(--text)` on `-viz`. A 1px gold hairline sits underneath, inset 4px from each edge, matching the "— EDITION —" hairline bracket treatment from the conference key art.

A small Orbitron subtitle in `var(--blue-bright)` tracked uppercase sits beside it: `AGENT ECOSYSTEM VISUALIZER` — mirrors the two-tier gold-over-cyan rhythm of the key art's headline block.

---

## 12. Accessibility Minima

- All interactive elements meet WCAG AA contrast at minimum (4.5:1 for text, 3:1 for UI)
- Focus rings: 2px `var(--blue-star)` offset 2px — visible against the void
- Scenario player respects `prefers-reduced-motion`: animations replaced with instant state changes
- Graph pan/zoom also keyboard-accessible (arrow keys pan, +/- zoom)

---

## 13. What This Design Is Not

- Not a dashboard (no KPI tiles, no charts)
- Not a diagram tool (user doesn't author the graph, they observe it)
- Not playful (no rounded everything, no emoji, no bright accent color randomly)
- Not minimal-Swiss (has atmosphere, circuitry, glow — warmth is allowed)

The closest reference in mood: the interior of a cinematic control room in a sci-fi film — dark, lit by the data, occasionally catching a gold glint off something important.

---

## 14. Audience vs Presenter Surfaces

The app ships **two view modes off the same route** (`/`). Which one renders is decided at runtime by a secret keystroke — the audience URL and the presenter URL are identical.

### Audience view (default)

What a participant sees on the projector. The graph must feel alive on its own; no UI element may hint that anything is scripted or that there are controls the audience cannot see.

**Chrome visible**:
- Header: conference logo + subtitle only
- Graph canvas with full ambient motion
- Status bar: state dot + counts + source label

**Chrome hidden**:
- `Load repo` button
- `DEMO` / `LIVE` mode toggle
- Scenario bar (entire row)
- `DEMO MODE` / `LIVE MODE` label in the status bar
- Any keyboard shortcut hint

### Presenter view

What the operator sees. Identical to audience view **plus** all the controls above. A small gold indicator dot in the bottom-right corner confirms presenter mode is active.

### Trigger

Press the `p` key three times within 600ms anywhere on the page. The same sequence toggles back off. The trigger does not appear in any UI hint, tooltip, or help text. If the browser is focused on an input or textarea, the trigger is ignored.

### Rule

Never surface a feature in the audience view that would betray that something was pre-scripted. If a control is only useful to a presenter, it must be gated behind presenter mode.

---

## 15. Portal Button

The primary CTA style — used for actions that feel like "opening a gateway" (Load repo, future: Replay, Export). Distinct from the flat `primary` Button variant; reserved for at most one element visible at a time.

### Anatomy

- **Fill**: vertical gradient `var(--surface-hi)` → `var(--abyss)`
- **Border**: 1px `var(--gold-deep)`, breathing 0.55 → 0.9 opacity over 4s (portal breath)
- **Inner top hairline**: 1px `var(--gold-bright)` at 30% opacity
- **Outer glow**: 18px blur, `var(--gold-glow)`, idle at 20% intensity
- **Label**: Orbitron 500 uppercase, tracking 0.14em, `var(--text)` idle → `var(--gold-bright)` on hover
- **Icon**: left-side, 14px, `var(--gold-bright)` on hover
- **Height**: 40px (matches standard button)

### Interaction

| State | Treatment |
|------|-----------|
| Idle | Breathing border + subtle gold outer glow |
| Hover | Gold flare ring expands outward from the border and fades (portal flare, 420ms); fill brightens one step; label text-shadow gold |
| Active / click | 180ms compress (scale 0.98) and release |
| Loading | Border switches to rotating dashed stroke; label becomes `INITIALIZING…` |
| Disabled | Breath paused, opacity 40%, no glow |

Only one portal button is visible per surface at a time — multiple portal buttons on screen dilute the effect.
