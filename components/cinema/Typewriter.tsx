"use client";

import { useEffect, useState } from "react";

export interface TypewriterProps {
  text: string;
  charsPerSec?: number;
  className?: string;
  /** Skip the animation immediately — used when reduced motion or for late-arriving events */
  instant?: boolean;
  onComplete?: () => void;
}

/**
 * Character-at-a-time text animator. Respects prefers-reduced-motion
 * via the `instant` prop from the caller.
 */
export function Typewriter({
  text,
  charsPerSec = 40,
  className,
  instant,
  onComplete,
}: TypewriterProps) {
  const [len, setLen] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) {
      setLen(text.length);
      onComplete?.();
      return;
    }
    setLen(0);
    let raf = 0;
    const start = performance.now();
    const total = text.length;
    const durationMs = (total / charsPerSec) * 1000;

    const tick = () => {
      const elapsed = performance.now() - start;
      const next = Math.min(total, Math.ceil((elapsed / durationMs) * total));
      setLen(next);
      if (next < total) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, charsPerSec, instant, onComplete]);

  return (
    <span className={className}>
      {text.slice(0, len)}
      {len < text.length && (
        <span className="inline-block w-[0.5ch] bg-current opacity-70 align-middle animate-pulse">
          &nbsp;
        </span>
      )}
    </span>
  );
}
