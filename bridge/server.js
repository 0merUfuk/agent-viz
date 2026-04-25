#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * agent-viz local bridge.
 *
 * Exposes:
 *   GET  /health                → {status, version, session}
 *   GET  /transcript/:sessionId → {sessionId, events} (in-memory ring buffer)
 *   POST /run                   → spawn claude subprocess, returns {sessionId}
 *   POST /hook/:kind            → hook payload ingress, broadcast over WS
 *   POST /abort                 → kill current subprocess
 *   WS   /ws                    → normalized event stream
 *
 * Runs on localhost only. No deps beyond `ws`.
 */

const http = require("node:http");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { WebSocketServer } = require("ws");
const { resolveScenario } = require("./scenarios");
const { parseStreamLines, truncateUtf8 } = require("./stream-parser");

const PORT = Number(process.env.AGENT_VIZ_BRIDGE_PORT || 4001);
const CLAUDE_BIN = process.env.AGENT_VIZ_CLAUDE_BIN || "claude";
const VERSION = "0.2.0";

const TRANSCRIPT_RING_CAP = 500;
const TRANSCRIPT_PRUNE_MS = 60_000;
const STDERR_MAX_LINE = 1 * 1024 * 1024; // 1MB hard cap per stderr line

let currentChild = null;
let currentSessionId = null;

/**
 * Per-session ring buffer of recent broadcast events. Lets WS clients that
 * connect mid-session catch up via a single `replay` message. Cleared one
 * minute after `session_end`.
 *
 * @type {Map<string, Array<object>>}
 */
const transcripts = new Map();
/** @type {Map<string, NodeJS.Timeout>} */
const transcriptPruneTimers = new Map();

const server = http.createServer(async (req, res) => {
  // Permissive CORS for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, { status: "ok", version: VERSION, session: currentSessionId });
    }

    if (req.method === "GET" && req.url && req.url.startsWith("/transcript/")) {
      const sessionId = req.url.slice("/transcript/".length).split("?")[0];
      const events = transcripts.get(sessionId);
      if (!events) return json(res, 404, { error: "unknown sessionId" });
      return json(res, 200, { sessionId, events });
    }

    if (req.method === "POST" && req.url === "/run") {
      const body = await readJson(req);
      const scenarioId = body?.scenarioId;
      if (!scenarioId) return json(res, 400, { error: "scenarioId required" });

      const scenario = resolveScenario(scenarioId);
      if (!scenario) return json(res, 404, { error: "unknown scenarioId" });

      if (currentChild) {
        return json(res, 409, { error: "session already running", sessionId: currentSessionId });
      }

      const sessionId = randomUUID();
      currentSessionId = sessionId;
      transcripts.set(sessionId, []);
      // If a prior prune timer is queued for this id (would be a UUID
      // collision; effectively never), cancel it.
      const existingPrune = transcriptPruneTimers.get(sessionId);
      if (existingPrune) {
        clearTimeout(existingPrune);
        transcriptPruneTimers.delete(sessionId);
      }

      // `--print` runs non-interactively; `--output-format stream-json`
      // emits one JSON event per line to stdout; `--verbose` is required
      // by Claude Code for stream-json with --print.
      const args = [];
      if (scenario.agent) args.push("--agent", scenario.agent);
      args.push(
        "--print",
        "--output-format", "stream-json",
        "--verbose",
        scenario.prompt,
      );

      broadcast({ kind: "session_started", sessionId, scenarioId });

      currentChild = spawn(CLAUDE_BIN, args, {
        cwd: scenario.cwd,
        env: { ...process.env, CLAUDE_AGENT_VIZ_SESSION: sessionId },
        stdio: ["ignore", "pipe", "pipe"],
      });

      attachStreamHandlers(currentChild, sessionId);

      currentChild.on("error", (err) => {
        const code = err && err.code;
        const message = code === "ENOENT"
          ? `claude CLI not on PATH (set AGENT_VIZ_CLAUDE_BIN to override; tried '${CLAUDE_BIN}')`
          : String(err.message || err);
        broadcast({ kind: "session_error", sessionId, message });
      });

      currentChild.on("exit", (code, signal) => {
        broadcast({ kind: "session_end", sessionId, exitCode: code, signal });
        currentChild = null;
        currentSessionId = null;
        scheduleTranscriptPrune(sessionId);
      });

      return json(res, 200, { sessionId });
    }

    if (req.method === "POST" && req.url === "/abort") {
      if (!currentChild) return json(res, 200, { aborted: false });
      try {
        currentChild.kill("SIGTERM");
      } catch (err) {
        broadcast({ kind: "session_error", sessionId: currentSessionId, message: String(err) });
      }
      return json(res, 200, { aborted: true, sessionId: currentSessionId });
    }

    if (req.method === "POST" && req.url && req.url.startsWith("/hook/")) {
      const kind = req.url.slice("/hook/".length).split("?")[0];
      const payload = await readJson(req);
      broadcast({ kind: `hook:${kind}`, sessionId: currentSessionId, payload });
      return json(res, 200, { ok: true });
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  } catch (err) {
    console.error("[bridge] error:", err);
    json(res, 500, { error: "internal", message: String(err && err.message) });
  }
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ kind: "hello", version: VERSION, session: currentSessionId }));
  if (currentSessionId) {
    const events = transcripts.get(currentSessionId);
    if (events && events.length > 0) {
      try {
        ws.send(JSON.stringify({
          kind: "replay",
          sessionId: currentSessionId,
          events,
        }));
      } catch {
        // best-effort; ignore send failures
      }
    }
  }
});

function broadcast(event) {
  const enriched = { ...event, ts: Date.now() };
  // Append to the in-memory transcript for the addressed session, capped
  // at TRANSCRIPT_RING_CAP entries. We record everything that goes over
  // the wire — including hook:* events — so a late-joining client gets a
  // coherent picture.
  const sid = enriched.sessionId;
  if (sid) {
    let buf = transcripts.get(sid);
    if (!buf) {
      buf = [];
      transcripts.set(sid, buf);
    }
    buf.push(enriched);
    if (buf.length > TRANSCRIPT_RING_CAP) {
      buf.splice(0, buf.length - TRANSCRIPT_RING_CAP);
    }
  }

  const payload = JSON.stringify(enriched);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      try {
        client.send(payload);
      } catch {
        // swallow — best-effort broadcast
      }
    }
  }
}

/**
 * Wire stdout/stderr handlers on a spawned Claude subprocess. Stdout is
 * parsed as line-delimited JSON; stderr is forwarded line by line as
 * `stderr` events. Both streams use shared per-stream leftover state so
 * lines split across chunks reassemble correctly.
 */
function attachStreamHandlers(child, sessionId) {
  let stdoutLeftover = "";
  if (child.stdout) {
    child.stdout.setEncoding("utf-8");
    child.stdout.on("data", (chunk) => {
      const result = parseStreamLines(chunk, stdoutLeftover);
      stdoutLeftover = result.leftover;
      for (const event of result.events) {
        broadcast({ kind: "stream", sessionId, event });
      }
      for (const line of result.rawLines) {
        broadcast({ kind: "stream_raw", sessionId, line });
      }
      if (result.oversized > 0) {
        broadcast({
          kind: "session_error",
          sessionId,
          message: `truncated ${result.oversized} oversized stdout line(s) exceeding 1MB`,
        });
      }
    });
    child.stdout.on("end", () => {
      // Flush any final partial line as raw output.
      if (stdoutLeftover) {
        broadcast({ kind: "stream_raw", sessionId, line: stdoutLeftover });
        stdoutLeftover = "";
      }
    });
  }

  let stderrLeftover = "";
  if (child.stderr) {
    child.stderr.setEncoding("utf-8");
    child.stderr.on("data", (chunk) => {
      const combined = stderrLeftover + chunk;
      const parts = combined.split("\n");
      stderrLeftover = parts.pop() || "";
      for (const raw of parts) {
        let line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
        if (!line) continue;
        if (Buffer.byteLength(line, "utf-8") > STDERR_MAX_LINE) {
          line = truncateUtf8(line, STDERR_MAX_LINE) + " [truncated]";
        }
        broadcast({ kind: "stderr", sessionId, line });
      }
    });
    child.stderr.on("end", () => {
      if (stderrLeftover) {
        broadcast({ kind: "stderr", sessionId, line: stderrLeftover });
        stderrLeftover = "";
      }
    });
  }
}

/**
 * Keep the transcript around briefly after `session_end` so a refresh
 * can still fetch it via `/transcript/:sessionId`, then discard.
 */
function scheduleTranscriptPrune(sessionId) {
  const existing = transcriptPruneTimers.get(sessionId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    transcripts.delete(sessionId);
    transcriptPruneTimers.delete(sessionId);
  }, TRANSCRIPT_PRUNE_MS);
  // Don't keep the event loop alive solely for transcript expiry.
  if (typeof timer.unref === "function") timer.unref();
  transcriptPruneTimers.set(sessionId, timer);
}

function json(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`agent-viz bridge listening on http://127.0.0.1:${PORT} (ws: /ws)`);
});

function shutdown() {
  if (currentChild) {
    try { currentChild.kill("SIGTERM"); } catch { /* noop */ }
  }
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
