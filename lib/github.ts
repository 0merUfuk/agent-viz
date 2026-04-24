/**
 * GitHub API client for fetching a repo's `.claude/` directory.
 * Server-side only — uses optional GITHUB_TOKEN for higher rate limit.
 */

export interface RepoSlug {
  owner: string;
  repo: string;
}

export type GitHubErrorCode =
  | "no-claude-dir"
  | "rate-limited"
  | "private-repo"
  | "repo-not-found"
  | "unknown";

export class GitHubError extends Error {
  constructor(
    public code: GitHubErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/**
 * Normalize a user-pasted value to an `{owner, repo}` pair.
 * Accepts: `owner/repo`, `github.com/owner/repo`, `https://github.com/owner/repo`,
 * with optional trailing slashes, `.git`, or path suffixes.
 */
export function parseSlug(input: string): RepoSlug | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Strip protocol
  let s = trimmed.replace(/^https?:\/\//i, "");
  // Strip github.com/
  s = s.replace(/^github\.com\//i, "");
  // Strip .git suffix
  s = s.replace(/\.git$/i, "");
  // Keep only first two segments
  const parts = s.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1];
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return { owner, repo };
}

interface ContentEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghFetch(url: string): Promise<Response> {
  return fetch(url, { headers: headers(), cache: "no-store" });
}

async function listDir(
  owner: string,
  repo: string,
  path: string,
): Promise<ContentEntry[] | null> {
  const res = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
      path,
    ).replace(/%2F/g, "/")}`,
  );
  if (res.status === 404) return null;
  if (res.status === 403) {
    const ratelimited = res.headers.get("x-ratelimit-remaining") === "0";
    throw new GitHubError(
      ratelimited ? "rate-limited" : "private-repo",
      ratelimited
        ? "GitHub API rate limit hit — set GITHUB_TOKEN to raise it."
        : "Repository is private or inaccessible without auth.",
    );
  }
  if (!res.ok) throw new GitHubError("unknown", `GitHub API ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    // Single-file response — treat as 1-element list
    return [data as ContentEntry];
  }
  return data as ContentEntry[];
}

/**
 * Recursively collect all files under a directory, returning a map of
 * path (relative to the `.claude/` root, e.g. `agents/foo.md`) → content.
 */
async function collectMarkdown(
  owner: string,
  repo: string,
  path: string,
  outputBasePath: string,
  out: Record<string, string>,
): Promise<void> {
  const entries = await listDir(owner, repo, path);
  if (!entries) return;

  // Limit recursion to prevent runaway fetches on huge repos.
  const MAX_FILES = 200;

  for (const entry of entries) {
    if (Object.keys(out).length >= MAX_FILES) break;
    if (entry.type === "dir") {
      await collectMarkdown(owner, repo, entry.path, outputBasePath, out);
      continue;
    }
    if (!entry.name.toLowerCase().endsWith(".md")) continue;
    if (!entry.download_url) continue;

    const body = await (await fetch(entry.download_url, { cache: "no-store" })).text();
    const key = entry.path.replace(/^\.?\/?\.claude\//, "");
    out[key] = body;
  }
}

export interface FetchResult {
  files: Record<string, string>;
  sourceLabel: string;
}

/**
 * Probe whether the repo itself is reachable. Called only when `.claude/`
 * fetch 404s, so we can distinguish "repo doesn't exist or is private"
 * from "repo exists but has no .claude/ dir". GitHub returns 404 for
 * private repos on unauthenticated requests (security feature) — that's
 * indistinguishable from a truly missing repo without a token.
 */
async function probeRepo(owner: string, repo: string): Promise<"ok" | "missing-or-private"> {
  const res = await ghFetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (res.ok) return "ok";
  return "missing-or-private";
}

export async function fetchClaudeDir({ owner, repo }: RepoSlug): Promise<FetchResult> {
  const slugLabel = `${owner}/${repo}`;
  const top = await listDir(owner, repo, ".claude");
  if (!top) {
    // Disambiguate: does the repo itself exist?
    const state = await probeRepo(owner, repo);
    if (state === "missing-or-private") {
      const hasToken = !!process.env.GITHUB_TOKEN;
      throw new GitHubError(
        "repo-not-found",
        hasToken
          ? `Repository ${slugLabel} not found. Check spelling, or confirm the GITHUB_TOKEN has access.`
          : `Repository ${slugLabel} not found or private. Set GITHUB_TOKEN in .env.local to access private repos.`,
      );
    }
    throw new GitHubError(
      "no-claude-dir",
      `Repository ${slugLabel} exists but has no .claude/ directory.`,
    );
  }

  const out: Record<string, string> = {};

  // Prefer just the three known subdirectories, but fall back to a full scan.
  const preferred = ["agents", "skills", "rules"];
  const preferredEntries = top.filter(
    (e) => e.type === "dir" && preferred.includes(e.name),
  );

  if (preferredEntries.length === 0) {
    // Repo might have a different layout — scan everything.
    for (const e of top) {
      if (e.type === "dir") {
        await collectMarkdown(owner, repo, e.path, ".claude", out);
      } else if (e.name.toLowerCase().endsWith(".md") && e.download_url) {
        const body = await (await fetch(e.download_url, { cache: "no-store" })).text();
        out[e.path.replace(/^\.?\/?\.claude\//, "")] = body;
      }
    }
  } else {
    for (const e of preferredEntries) {
      await collectMarkdown(owner, repo, e.path, ".claude", out);
    }
  }

  if (Object.keys(out).length === 0) {
    throw new GitHubError(
      "no-claude-dir",
      `Repository ${slugLabel} has a .claude/ directory, but no markdown files were found.`,
    );
  }

  return { files: out, sourceLabel: slugLabel };
}
