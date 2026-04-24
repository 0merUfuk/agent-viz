"use client";

import { useMemo } from "react";

/**
 * Canvas backdrop — circuit tracery tile + three radial rings + sparse starlight.
 * All layers are `pointer-events-none` and sit behind React Flow's render layer.
 */

const STAR_COUNT = 42;
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
}

function generateStars(count: number): Star[] {
  const rand = mulberry32(1729);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * 100;
    const y = rand() * 100;
    const tier = (Math.ceil(rand() * 3) as 1 | 2 | 3);
    const size = tier === 3 ? 2 : tier === 2 ? 1.5 : 1;
    // Amber stars live only in the lower-right quadrant (DESIGN.md §6).
    const amber = rand() < 0.1 && x > 60 && y > 60;
    stars.push({ x, y, size, tier, amber });
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

export function CanvasBackdrop() {
  const stars = useMemo(() => generateStars(STAR_COUNT), []);
  const fragments = useMemo(() => generateFragments(), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Circuit tracery tile */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "url('/circuit-pattern.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "240px 240px",
        }}
      />

      {/* Three radial rings pulsing */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[720, 520, 340].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border border-[var(--blue-deep)]/25 radial-pulse"
            style={{
              width: size,
              height: size,
              animationDelay: `${i * -2000}ms`,
            }}
          />
        ))}
      </div>

      {/* Code fragments */}
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

      {/* Starlight points */}
      <div className="absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: s.amber ? "#F5B041" : "var(--blue-star)",
              opacity: s.tier === 3 ? 0.9 : s.tier === 2 ? 0.55 : 0.3,
              filter: s.tier === 3 ? "drop-shadow(0 0 3px currentColor)" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
