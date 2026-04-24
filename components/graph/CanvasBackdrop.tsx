"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Canvas backdrop — five-layer parallax space (DESIGN.md §5).
 *   L1 Nebula      — two soft radial gradients panning opposite directions
 *   L2 Starfield   — 120 seeded stars, individually twinkling
 *   L3 Orbits      — 3 elliptical dashed rings rotating at different speeds
 *   L4 Circuit     — tiled SVG drifting diagonally
 *   L5 Shooting    — single gold streak every 25–40s
 *
 * Plus a static code-fragment texture layer for depth (DESIGN.md §6b).
 * All layers are GPU-transformed only (`translate3d`, `rotate`, `opacity`);
 * none triggers reflow. Everything falls to static under `prefers-reduced-motion`.
 */

const STAR_COUNT = 120;
const CODE_SNIPPETS = [
  "0xA3FC", "RAD:CORE:3", "ln:42", "OK.", "0xFF00", "SEG:12",
  "init()", "TRACE", "0x77A1", "ok",
  "RUN:01", "NODE:READY", "0x0101", "TIMING:OK",
  "0x5E80", "SYNC", "0xB2C4", "EXEC",
  "0xF104", "PEER:3", "0xAC81", "RX:OK",
  "CH:07", "0x3A22", "ok", "0xDD00",
  "AGT:12", "0x9910", "OK", "WAIT",
  "0x4421", "RDY", "0x1205", "PING",
  "0xBA00", "ok", "SND", "0x7711",
  "0x0F20", "RAD:17", "TX:OK",
];

// Deterministic PRNG so star positions are stable across renders and SSR.
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  x: number;
  y: number;
  size: number;
  tier: 1 | 2 | 3;
  amber: boolean;
  twinkleDuration: number;
  twinkleDelay: number;
}

function generateStars(count: number): Star[] {
  const rand = mulberry32(1729);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * 100;
    const y = rand() * 100;
    const tier = Math.ceil(rand() * 3) as 1 | 2 | 3;
    const size = tier === 3 ? 2.2 : tier === 2 ? 1.5 : 1;
    const amber = rand() < 0.1 && x > 60 && y > 60;
    // twinkle 3–8s, random phase
    const twinkleDuration = 3000 + rand() * 5000;
    const twinkleDelay = rand() * -8000;
    stars.push({ x, y, size, tier, amber, twinkleDuration, twinkleDelay });
  }
  return stars;
}

interface CodeFragment {
  x: number;
  y: number;
  text: string;
}

function generateFragments(): CodeFragment[] {
  const rand = mulberry32(97531);
  return CODE_SNIPPETS.map((text) => ({
    x: rand() * 100,
    y: rand() * 100,
    text,
  }));
}

/* ----- L5 Shooting star ----- */
interface Streak {
  id: number;
  topPct: number;   // 0–60 (upper ~two-thirds of viewport)
  leftPct: number;  // start just off-screen left
  angleDeg: number; // tilt
  widthPx: number;  // streak length
}

function randomStreak(id: number): Streak {
  const r = Math.random;
  return {
    id,
    topPct: 5 + r() * 55,
    leftPct: -20,
    angleDeg: -18 + r() * 12,        // -18° to -6°
    widthPx: 140 + Math.floor(r() * 80),
  };
}

function useShootingStars(): Streak[] {
  const [streaks, setStreaks] = useState<Streak[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let id = 1;
    let timer: ReturnType<typeof setTimeout>;

    const fire = () => {
      const s = randomStreak(id++);
      setStreaks((prev) => [...prev.slice(-2), s]);
      // remove after its traverse completes
      setTimeout(() => {
        setStreaks((prev) => prev.filter((x) => x.id !== s.id));
      }, 1400);
      // schedule next streak between 18 and 42 seconds away
      const wait = 18000 + Math.random() * 24000;
      timer = setTimeout(fire, wait);
    };

    timer = setTimeout(fire, 4000 + Math.random() * 6000);
    return () => clearTimeout(timer);
  }, []);

  return streaks;
}

export function CanvasBackdrop() {
  const stars = useMemo(() => generateStars(STAR_COUNT), []);
  const fragments = useMemo(() => generateFragments(), []);
  const streaks = useShootingStars();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* L1 — Nebula: two large soft radial gradients panning opposite directions */}
      <div className="nebula-layer absolute inset-[-20%] opacity-80">
        <div className="nebula-cyan absolute inset-0" />
        <div className="nebula-gold absolute inset-0" />
      </div>

      {/* L4 — Circuit pattern drifting diagonally (placed early so stars sit above) */}
      <div
        className="circuit-drift absolute inset-[-10%]"
        style={{
          backgroundImage: "url('/circuit-pattern.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "240px 240px",
          opacity: 0.06,
        }}
      />

      {/* Code fragments — static texture */}
      <div className="absolute inset-0">
        {fragments.map((f, i) => (
          <span
            key={i}
            className="absolute text-[10px] font-[var(--font-mono)] text-[var(--blue-deep)] opacity-[0.18]"
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
          >
            {f.text}
          </span>
        ))}
      </div>

      {/* L3 — Orbital rings, three of them rotating at different speeds */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="orbit-slow absolute rounded-full border border-[var(--blue-deep)]/20"
          style={{ width: 920, height: 920, borderStyle: "dashed", borderWidth: 1 }}
        />
        <div
          className="orbit-med absolute rounded-full border border-[var(--blue-deep)]/18"
          style={{ width: 640, height: 640, borderStyle: "dashed", borderWidth: 1 }}
        />
        <div
          className="orbit-fast absolute rounded-full border border-[var(--blue-deep)]/22"
          style={{ width: 400, height: 400, borderStyle: "dashed", borderWidth: 1 }}
        />
      </div>

      {/* L2 — Starfield, individually twinkling */}
      <div className="absolute inset-0">
        {stars.map((s, i) => {
          const baseOpacity = s.tier === 3 ? 0.9 : s.tier === 2 ? 0.55 : 0.3;
          return (
            <span
              key={i}
              className="star absolute rounded-full"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                background: s.amber ? "#F5B041" : "var(--blue-star)",
                ["--star-base" as string]: baseOpacity,
                animationDuration: `${s.twinkleDuration}ms`,
                animationDelay: `${s.twinkleDelay}ms`,
                filter: s.tier === 3 ? "drop-shadow(0 0 3px currentColor)" : undefined,
              }}
            />
          );
        })}
      </div>

      {/* L5 — Shooting stars: gold streaks traversing the upper canvas */}
      <div className="absolute inset-0">
        {streaks.map((s) => (
          <span
            key={s.id}
            className="shooting-star absolute"
            style={{
              top: `${s.topPct}%`,
              left: `${s.leftPct}%`,
              width: s.widthPx,
              transform: `rotate(${s.angleDeg}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
