**Version**: 1.0
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

## 5. Motif: Radial Pulse

Behind the graph, three concentric rings (1px strokes, 25% opacity, `var(--blue-deep)`) centered on the graph's centroid. A single slow radial gradient pulse animates outward every 6 seconds, reinforcing the "active system" feeling even when idle.

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

| Kind | Duration | Easing |
|------|----------|--------|
| Panel slide-in | 280ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Node hover glow | 180ms | `ease-out` |
| Scenario step pulse | 1200ms (per step) | custom keyframe: scale 1 → 1.08 → 1 + glow fade |
| Edge trace | 900ms | `ease-in-out`, stroke-dashoffset animation |
| Radial pulse | 6000ms infinite | `ease-in-out` |

No bouncy springs anywhere. Motion is confident and slow — this is a cinematic interface, not a toy.

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
│  ○ Idle   ·   10 agents  ·  14 skills  ·  4 rules            │  32px
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
