"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Ecosystem } from "@/lib/types";

export interface RepoLoaderProps {
  open: boolean;
  onClose: () => void;
  onLoaded: (eco: Ecosystem) => void;
  onLoadSample: () => void;
}

type ErrorCode =
  | "no-claude-dir"
  | "rate-limited"
  | "private-repo"
  | "repo-not-found"
  | "unknown";

const ERROR_COPY: Record<ErrorCode, string> = {
  "no-claude-dir": "This repo exists but has no .claude/ directory.",
  "rate-limited":
    "GitHub rate limit hit. Wait an hour or set GITHUB_TOKEN in .env.local.",
  "private-repo":
    "Repository is private. Set GITHUB_TOKEN in .env.local with repo scope to access it.",
  "repo-not-found":
    "Repo not found, or private without a token. Check spelling, or set GITHUB_TOKEN in .env.local.",
  unknown: "Something went wrong. Check the URL and try again.",
};

/** Known-good public repos with .claude/ content — click to pre-fill. */
const EXAMPLE_REPOS: Array<{ slug: string; label: string }> = [
  { slug: "SuperClaude-Org/SuperClaude_Framework", label: "SuperClaude_Framework" },
  { slug: "anthropics/claude-code", label: "claude-code" },
  { slug: "hesreallyhim/awesome-claude-code", label: "awesome-claude-code" },
];

export function RepoLoader({ open, onClose, onLoaded, onLoadSample }: RepoLoaderProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setError(null);
      setErrorDetail(null);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const res = await fetch("/api/fetch-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError((data.error as ErrorCode) ?? "unknown");
        setErrorDetail(typeof data.message === "string" ? data.message : null);
        return;
      }
      onLoaded(data as Ecosystem);
    } catch (err) {
      console.error(err);
      setError("unknown");
      setErrorDetail("Network error contacting the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className={cn(
          "relative w-full max-w-xl border border-[var(--border-subtle)] bg-[var(--abyss)] p-6",
          "shadow-[0_0_64px_rgba(0,0,0,0.7)]",
        )}
        style={{ boxShadow: "inset 0 1px 0 var(--gold-deep), 0 0 64px rgba(0,0,0,0.7)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <p className="text-display-sm text-[var(--blue-bright)] mb-1">Load ecosystem</p>
        <h2 className="text-title text-[var(--gold-bright)] mb-4">
          Paste a public GitHub repo
        </h2>
        <p className="text-body text-[var(--text-muted)] mb-2">
          The repo must contain a <code className="text-mono-sm text-[var(--blue-bright)]">.claude/</code>{" "}
          directory with agents, skills, or rules.
        </p>
        <p className="text-label text-[var(--text-dim)] mb-5">
          Private repos require{" "}
          <code className="text-mono-sm text-[var(--gold-bright)]">GITHUB_TOKEN</code>{" "}
          in <code className="text-mono-sm text-[var(--blue-bright)]">.env.local</code> — see{" "}
          <code className="text-mono-sm text-[var(--blue-bright)]">.env.local.example</code>.
        </p>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
          />
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            placeholder="owner/repo  ·  github.com/owner/repo  ·  https://github.com/..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={cn(
              "h-11 w-full border bg-[var(--void)] pl-9 pr-4 text-body text-[var(--text)]",
              "outline-none placeholder:text-[var(--text-dim)]",
              error
                ? "border-[var(--live)]"
                : "border-[var(--border-subtle)] focus:border-[var(--blue-bright)]",
            )}
          />
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 border border-[var(--live)]/40 bg-[rgba(244,114,182,0.05)] p-3">
            <AlertTriangle size={14} className="mt-0.5 text-[var(--live)] shrink-0" />
            <div className="text-body text-[var(--text)]">
              <p>{ERROR_COPY[error]}</p>
              {errorDetail && (
                <p className="mt-1 text-label text-[var(--text-muted)]">{errorDetail}</p>
              )}
            </div>
          </div>
        )}

        {/* Try-one-of-these row — click to pre-fill and submit. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-label text-[var(--text-dim)] uppercase tracking-[0.18em] font-[var(--font-orbitron)]">
            Try
          </span>
          {EXAMPLE_REPOS.map((ex) => (
            <button
              key={ex.slug}
              type="button"
              disabled={loading}
              onClick={() => {
                setValue(ex.slug);
                setError(null);
                setErrorDetail(null);
              }}
              className={cn(
                "border border-[var(--border-subtle)] bg-[var(--void)] px-2.5 py-1",
                "hover:border-[var(--blue-bright)] hover:text-[var(--blue-bright)] transition-colors",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "text-mono-sm text-[var(--text-muted)]",
              )}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={!value.trim() || loading}
            className={cn(
              "h-10 px-5 border border-[var(--blue)] bg-[var(--blue-deep)]",
              "hover:bg-[var(--blue)] hover:border-[var(--blue-bright)] transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text)]",
            )}
          >
            {loading ? "Loading…" : "Load"}
          </button>
          <button
            type="button"
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            className="h-10 px-5 border border-[var(--border-subtle)] bg-[var(--abyss)] hover:border-[var(--border-active)] hover:bg-[var(--surface)] transition-colors text-label uppercase tracking-[0.14em] font-[var(--font-orbitron)] text-[var(--text)]"
          >
            Load sample
          </button>
          <span className="flex-1" />
          <span className="text-label text-[var(--text-dim)] hidden sm:inline">
            Esc to close
          </span>
        </div>
      </form>
    </div>
  );
}
