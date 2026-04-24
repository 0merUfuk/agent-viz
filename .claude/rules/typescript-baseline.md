**Version**: 1.0
**Created**: 2026-04-25
**Last Updated**: 2026-04-25
**Authors:** Ömer Ufuk

---

# TypeScript Baseline — agent-viz

> Auto-loaded when working in TypeScript / TSX files. The most common security and correctness mistakes for a Next.js cinema app that fetches user-supplied GitHub markdown and renders it. Read before writing any code that handles user input, fetched content, env vars, or URL construction.

---

## 1. Markdown / HTML Injection

The cinema demo fetches markdown from arbitrary GitHub repos and renders it via `MarkdownBody`. Treat **every fetched string as untrusted**.

```tsx
// WRONG — interpolates fetched markdown into raw HTML
<div dangerouslySetInnerHTML={{ __html: marked(fetched) }} />

// CORRECT — render through the existing sanitized pipeline
<MarkdownBody source={fetched} />
```

`MarkdownBody` uses a sanitizing renderer. Never reach for `dangerouslySetInnerHTML` on a parser surface. If you must inline raw HTML for theming, do it on **trusted** strings only (constants, never fetched content).

---

## 2. URL Construction

Never concatenate user input into URLs. Use `URL` / `URLSearchParams` so the runtime escapes for you:

```ts
// WRONG — owner/repo with `../` traverses the GitHub API path
const url = `https://api.github.com/repos/${owner}/${repo}/contents/.claude`;

// CORRECT — validate then encode
const safe = /^[A-Za-z0-9_.-]+$/;
if (!safe.test(owner) || !safe.test(repo)) throw new Error("invalid repo identifier");
const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/.claude`;
```

`lib/github.ts` is the single source of truth for GitHub URL construction — extend it, do not reinvent in components.

---

## 3. Environment Variables

- Server-only secrets (e.g., `GITHUB_TOKEN`) MUST live in env vars, never in code, never in `NEXT_PUBLIC_*` (which ships to the browser)
- Read with `process.env.GITHUB_TOKEN` only inside `app/api/**` route handlers or server components
- Never log a token, even at debug level — log presence only (`token ? "set" : "missing"`)
- `.env.local` is gitignored; commit only `.env.local.example` with placeholder values

---

## 4. Fetch With User Input

Every `fetch` that takes user-controlled input must:

- Validate input shape before constructing the request
- Set an explicit `Accept` header
- Handle 401, 403, 404, 429, 5xx as distinct error codes (never collapse to "failed")
- Return a typed error code, not a thrown string

`lib/github.ts` already encodes this contract via `GitHubErrorCode` — preserve it when adding new endpoints.

---

## 5. Randomness for Security

- Use `crypto.randomUUID()` or `crypto.getRandomValues(new Uint8Array(N))` for tokens, session ids, broadcast epochs that need unpredictability
- `Math.random()` is acceptable for animation jitter and scenario shuffling — never for anything an attacker could exploit by guessing

```ts
// CORRECT — unpredictable epoch
const epoch = crypto.randomUUID();

// ACCEPTABLE — visual jitter, no security implication
const wobble = Math.random() * 0.1;
```

---

## 6. Strict Null & Boolean Coercion

The repo runs `strictNullChecks`. Two recurring bug shapes:

- **Optional booleans into required boolean props** — coerce with `!!` or default with `??`:
  ```tsx
  <ScenarioPlayer playing={!!state.playing} />
  ```
- **Nullable arrays** — guard with `len > 0` before `[0]` access:
  ```ts
  if (ecosystem.agents.length > 0) {
    const first = ecosystem.agents[0];
  }
  ```

If TypeScript complains, fix the type — do not paper over with `as any` or `!` non-null assertions on values that genuinely can be null.

---

## 7. BroadcastChannel & State

- Always feature-detect: `typeof BroadcastChannel !== "undefined"`
- Always pair with the `localStorage` fallback in `lib/cinema-sync.ts`
- Never ship raw user objects across the channel — only serializable plain data
- Reject out-of-order messages by epoch — never trust message order across tabs

---

## 8. Server vs Client Components

- API key reads, file reads, and shell commands must be in server-only modules (`app/api/**` or files marked `"use server"`)
- Components that render fetched markdown are client components (`"use client"`) but must consume already-sanitized data
- Never `import` a server-only module from a client component — Next.js will bundle the secret into the browser

---

## 9. Dependency Hygiene

- Pin transitive ranges with `package-lock.json`; commit it
- Run `npm audit` before any release; treat HIGH and CRITICAL as blockers
- New runtime deps require a one-line justification in the PR description
- Prefer the platform (`crypto`, `fetch`, `URL`) over npm packages when the API is sufficient
