/**
 * Seeded jitter for scenario strings.
 *
 * Scenarios carry templated strings such as
 * `"Build complete · {ms}s · 0 warnings"`. At playback time we substitute
 * placeholders with deterministic-but-varying integers so the demo never
 * shows the same round marketing number twice, but a single run stays
 * internally consistent — the same template rendered again inside the
 * same scenario returns the same value.
 *
 * If the caller omits `seed`, we derive one from
 * `Math.floor(Date.now() / 60_000)` — a coarse per-minute bucket. Values
 * vary per session but stay stable across a single playback. Pass an
 * explicit seed for tests or for locking a specific run.
 *
 * Placeholders: {n} 1..12, {ms} 0.8..3.4 (one decimal), {pct} 82..99,
 * {pr} 100..4800.
 */

export interface JitterCtx {
  scenarioId: string;
  seed?: number;
}

type Kind = "n" | "ms" | "pct" | "pr";

const RANGES: Record<Kind, [number, number]> = {
  n: [1, 12],
  ms: [8, 34], // tenths of a second; formatted as 0.8..3.4
  pct: [82, 99],
  pr: [100, 4800],
};

/** Mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap, stable string hash (FNV-1a 32-bit). */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pickInt(kind: Kind, key: string): number {
  const [lo, hi] = RANGES[kind];
  const rng = mulberry32(hash32(key));
  return lo + Math.floor(rng() * (hi - lo + 1));
}

const TOKEN = /\{(n|ms|pct|pr)\}/g;

export function jitter(template: string, ctx: JitterCtx): string {
  const seed = ctx.seed ?? Math.floor(Date.now() / 60_000);
  let pos = 0;
  return template.replace(TOKEN, (_, kind: Kind) => {
    const key = `${ctx.scenarioId}:${seed}:${pos++}:${kind}`;
    const v = pickInt(kind, key);
    return kind === "ms" ? (v / 10).toFixed(1) : String(v);
  });
}
