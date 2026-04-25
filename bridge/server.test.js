/* eslint-disable no-console */
const { test, after, before } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const WebSocket = require("ws");

// We boot the bridge as a child process so server.test.js can stand alone
// without exporting internals from server.js. The bridge listens on a
// non-default port so it doesn't clash with a developer's running bridge.

const BRIDGE_PORT = 4101 + Math.floor(Math.random() * 100);
const BASE = `http://127.0.0.1:${BRIDGE_PORT}`;
const WS_URL = `ws://127.0.0.1:${BRIDGE_PORT}/ws`;

// A tiny stub binary that emits a few stream-json lines and exits. Lets us
// exercise the stdout parsing path without needing the real `claude` CLI.
const STUB_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "agent-viz-bridge-test-"));
const STUB_PATH = path.join(STUB_DIR, "claude-stub.js");
fs.writeFileSync(
  STUB_PATH,
  "#!/usr/bin/env node\n" +
    "process.stdout.write('{\"kind\":\"system\",\"subtype\":\"init\"}\\n');\n" +
    "process.stdout.write('{\"kind\":\"assistant\",\"message\":\"hello\"}\\n');\n" +
    "process.stdout.write('not-json line on stdout\\n');\n" +
    "process.stderr.write('a warning on stderr\\n');\n" +
    "process.stdout.write('{\"kind\":\"result\",\"ok\":true}\\n');\n",
  { mode: 0o755 },
);

// Launch the bridge with the stub bound as the `claude` binary.
let bridgeProc;
let bridgeStderr = "";

before(async () => {
  bridgeProc = spawn(
    process.execPath,
    [path.join(__dirname, "server.js")],
    {
      env: {
        ...process.env,
        AGENT_VIZ_BRIDGE_PORT: String(BRIDGE_PORT),
        AGENT_VIZ_CLAUDE_BIN: `${process.execPath} ${STUB_PATH}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  bridgeProc.stderr.on("data", (d) => {
    bridgeStderr += d.toString();
  });
  // Wait for the listen log line.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`bridge did not start within 3s; stderr: ${bridgeStderr}`)), 3000);
    bridgeProc.stdout.on("data", (d) => {
      if (d.toString().includes("listening on")) {
        clearTimeout(timer);
        resolve();
      }
    });
    bridgeProc.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`bridge exited early with code ${code}; stderr: ${bridgeStderr}`));
    });
  });
});

after(async () => {
  if (bridgeProc && !bridgeProc.killed) {
    bridgeProc.kill("SIGTERM");
  }
  fs.rmSync(STUB_DIR, { recursive: true, force: true });
});

// Note: `AGENT_VIZ_CLAUDE_BIN` is treated as a single argv entry by the
// bridge's `spawn()`. Splitting `"node /path/to/stub"` would require shell
// interpretation, which we deliberately avoid for security. The bridge
// supports a single binary path; for the stub-with-arg case we wrap it in
// a wrapper script.
let WRAPPER_PATH;
before(() => {
  WRAPPER_PATH = path.join(STUB_DIR, "claude-wrapper.sh");
  fs.writeFileSync(
    WRAPPER_PATH,
    `#!/bin/sh\nexec "${process.execPath}" "${STUB_PATH}" "$@"\n`,
    { mode: 0o755 },
  );
  // Restart bridge with the wrapper if needed. For most tests we don't
  // hit /run, so the env from `before()` is fine; the stub override only
  // matters when we actually spawn.
});

function httpGet(pathname) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${pathname}`, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

function httpPost(pathname, body) {
  return new Promise((resolve, reject) => {
    const data = body == null ? "" : JSON.stringify(body);
    const req = http.request(
      `${BASE}${pathname}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          resolve({ status: res.statusCode, body: text });
        });
      },
    );
    req.on("error", reject);
    req.end(data);
  });
}

test("GET /health returns 200 with version", async () => {
  const res = await httpGet("/health");
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.status, "ok");
  assert.equal(typeof body.version, "string");
  assert.match(body.version, /^\d+\.\d+\.\d+/);
  assert.equal(body.session, null);
});

test("POST /run with missing scenarioId returns 400", async () => {
  const res = await httpPost("/run", {});
  assert.equal(res.status, 400);
  const body = JSON.parse(res.body);
  assert.equal(body.error, "scenarioId required");
});

test("POST /run with unknown scenarioId returns 404", async () => {
  const res = await httpPost("/run", { scenarioId: "nonsense" });
  assert.equal(res.status, 404);
  const body = JSON.parse(res.body);
  assert.equal(body.error, "unknown scenarioId");
});

test("WebSocket /ws emits hello with version", async () => {
  const ws = new WebSocket(WS_URL);
  const event = await new Promise((resolve, reject) => {
    ws.on("message", (data) => resolve(JSON.parse(data.toString())));
    ws.on("error", reject);
    setTimeout(() => reject(new Error("timeout")), 2000);
  });
  ws.close();
  assert.equal(event.kind, "hello");
  assert.equal(typeof event.version, "string");
});

test("GET /transcript/:unknown returns 404", async () => {
  const res = await httpGet("/transcript/00000000-0000-0000-0000-000000000000");
  assert.equal(res.status, 404);
});

test("POST /run while session running returns 409 (with stub binary)", async () => {
  // Re-spawn bridge with a long-running stub so the second /run hits 409.
  const longStub = path.join(STUB_DIR, "claude-long.sh");
  fs.writeFileSync(
    longStub,
    "#!/bin/sh\nsleep 5\n",
    { mode: 0o755 },
  );

  const port = BRIDGE_PORT + 1;
  const proc = spawn(
    process.execPath,
    [path.join(__dirname, "server.js")],
    {
      env: {
        ...process.env,
        AGENT_VIZ_BRIDGE_PORT: String(port),
        AGENT_VIZ_CLAUDE_BIN: longStub,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let buf = "";
  proc.stderr.on("data", (d) => { buf += d.toString(); });

  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`bridge did not start; stderr: ${buf}`)), 3000);
      proc.stdout.on("data", (d) => {
        if (d.toString().includes("listening on")) {
          clearTimeout(t);
          resolve();
        }
      });
      proc.on("exit", (code) => {
        clearTimeout(t);
        reject(new Error(`bridge exited early code=${code}; stderr: ${buf}`));
      });
    });

    const post = (body) => new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request(
        `http://127.0.0.1:${port}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
          },
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf-8") }));
        },
      );
      req.on("error", reject);
      req.end(data);
    });

    const first = await post({ scenarioId: "s1-review" });
    assert.equal(first.status, 200);
    const firstBody = JSON.parse(first.body);
    assert.match(firstBody.sessionId, /^[0-9a-f-]{36}$/);

    const second = await post({ scenarioId: "s1-review" });
    assert.equal(second.status, 409);
    const secondBody = JSON.parse(second.body);
    assert.equal(secondBody.error, "session already running");
  } finally {
    proc.kill("SIGTERM");
  }
});

test("stream-json output from a stub binary is broadcast as stream events", async () => {
  // Spawn a fresh bridge whose `claude` is a wrapper that exec's the stub.
  // We need a wrapper because AGENT_VIZ_CLAUDE_BIN is treated as a single
  // argv entry (no shell interpretation, by design).
  const port = BRIDGE_PORT + 2;
  const proc = spawn(
    process.execPath,
    [path.join(__dirname, "server.js")],
    {
      env: {
        ...process.env,
        AGENT_VIZ_BRIDGE_PORT: String(port),
        AGENT_VIZ_CLAUDE_BIN: WRAPPER_PATH,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let buf = "";
  proc.stderr.on("data", (d) => { buf += d.toString(); });

  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`bridge did not start; stderr: ${buf}`)), 3000);
      proc.stdout.on("data", (d) => {
        if (d.toString().includes("listening on")) {
          clearTimeout(t);
          resolve();
        }
      });
      proc.on("exit", (code) => {
        clearTimeout(t);
        reject(new Error(`bridge exited early code=${code}; stderr: ${buf}`));
      });
    });

    // Connect WS first, then post /run, so we capture every broadcast.
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const events = [];
    const ended = new Promise((resolve) => {
      ws.on("message", (data) => {
        const e = JSON.parse(data.toString());
        events.push(e);
        if (e.kind === "session_end") resolve();
      });
    });
    await new Promise((resolve, reject) => {
      ws.on("open", resolve);
      ws.on("error", reject);
      setTimeout(() => reject(new Error("ws never opened")), 2000);
    });

    const post = (body) => new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request(
        `http://127.0.0.1:${port}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
          },
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf-8") }));
        },
      );
      req.on("error", reject);
      req.end(data);
    });

    const runRes = await post({ scenarioId: "s1-review" });
    assert.equal(runRes.status, 200);

    await Promise.race([
      ended,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`session_end did not arrive; got ${events.length} events`)), 4000)),
    ]);

    ws.close();

    const kinds = events.map((e) => e.kind);
    assert.ok(kinds.includes("hello"), `kinds: ${kinds.join(",")}`);
    assert.ok(kinds.includes("session_started"), `kinds: ${kinds.join(",")}`);
    assert.ok(kinds.includes("stream"), `kinds: ${kinds.join(",")}`);
    assert.ok(kinds.includes("stream_raw"), `kinds: ${kinds.join(",")}`);
    assert.ok(kinds.includes("stderr"), `kinds: ${kinds.join(",")}`);
    assert.ok(kinds.includes("session_end"), `kinds: ${kinds.join(",")}`);

    // Verify the structured stream events have the parsed Claude record
    // attached under `event`, not the raw line.
    const streamEvents = events.filter((e) => e.kind === "stream");
    assert.ok(streamEvents.length >= 3);
    assert.equal(streamEvents[0].event.kind, "system");
    assert.equal(streamEvents[1].event.kind, "assistant");

    const rawEvents = events.filter((e) => e.kind === "stream_raw");
    assert.ok(rawEvents.length >= 1);
    assert.equal(rawEvents[0].line, "not-json line on stdout");

    const stderrEvents = events.filter((e) => e.kind === "stderr");
    assert.ok(stderrEvents.length >= 1);
    assert.equal(stderrEvents[0].line, "a warning on stderr");
  } finally {
    proc.kill("SIGTERM");
  }
});
