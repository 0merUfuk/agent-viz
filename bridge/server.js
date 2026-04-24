#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * agent-viz local bridge.
 *
 * Exposes:
 *   GET  /health           → {status, version}
 *   POST /run              → spawn claude subprocess, returns {sessionId}
 *   POST /hook/:kind       → hook payload ingress, broadcast over WS
 *   POST /abort            → kill current subprocess
 *   WS   /ws               → normalized event stream
 *
 * Runs on localhost only. No deps beyond `ws`.
 */

const http = require("node:http");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { WebSocketServer } = require("ws");
const { resolveScenario } = require("./scenarios");

const PORT = Number(process.env.AGENT_VIZ_BRIDGE_PORT || 4001);
const VERSION = "0.1.0";

let currentChild = null;
let currentSessionId = null;

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

      const args = [];
      if (scenario.agent) args.push("--agent", scenario.agent);
      args.push("-p", scenario.prompt);

      broadcast({ kind: "session_started", sessionId, scenarioId });

      currentChild = spawn("claude", args, {
        cwd: scenario.cwd,
        env: { ...process.env, CLAUDE_AGENT_VIZ_SESSION: sessionId },
        stdio: "ignore",
      });

      currentChild.on("error", (err) => {
        broadcast({ kind: "session_error", sessionId, message: String(err.message || err) });
      });

      currentChild.on("exit", (code) => {
        broadcast({ kind: "session_end", sessionId, exitCode: code });
        currentChild = null;
        currentSessionId = null;
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
});

function broadcast(event) {
  const json = JSON.stringify({ ...event, ts: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      try {
        client.send(json);
      } catch {
        // swallow — best-effort broadcast
      }
    }
  }
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
