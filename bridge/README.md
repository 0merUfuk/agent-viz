# agent-viz bridge

Local HTTP + WebSocket daemon that bridges the agent-viz web app to the
`claude` CLI on your laptop. When the app is in **Live mode**, clicking a
scenario posts to this bridge; the bridge spawns `claude` with a pre-canned
prompt, and Claude's hooks POST event payloads back. The bridge rebroadcasts
those events over WebSocket so the graph animates from real execution.

Runs on **`localhost:4001`** only. No authentication — this is a local
development tool.

---

## Prerequisites

1. Node.js 18 or later
2. `claude` CLI on your `PATH` (Claude Code 1.0+ — must support
   `--print --output-format=stream-json --verbose`)

---

## Install + run

```bash
cd bridge
npm install
node server.js
```

You should see:

```
agent-viz bridge listening on http://127.0.0.1:4001 (ws: /ws)
```

With the bridge running, open `http://localhost:3000` in a browser; the
**Live** toggle in the header should become available within a second.

---

## Hook configuration

For the graph to animate from real events, `claude` must POST its hooks
to the bridge. Add the following to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:4001/hook/session-start -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:4001/hook/pre-tool-use -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:4001/hook/post-tool-use -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:4001/hook/subagent-stop -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:4001/hook/stop -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ]
  }
}
```

### Rollback

To remove the hooks after the conference:

```jsonc
{
  "hooks": {}
}
```

Or simply delete the keys you added. The bridge fails open — if the hook
can't reach `localhost:4001`, `curl` just times out and `claude` continues
normally.

---

## API

| Method | Path                      | Body              | Returns                       |
|--------|---------------------------|-------------------|-------------------------------|
| GET    | `/health`                 | —                 | `{status, version, session}`  |
| GET    | `/transcript/:sessionId`  | —                 | `{sessionId, events}` or 404  |
| POST   | `/run`                    | `{scenarioId}`    | `{sessionId}`                 |
| POST   | `/abort`                  | —                 | `{aborted, sessionId}`        |
| POST   | `/hook/:kind`             | raw hook payload  | `{ok: true}`                  |
| WS     | `/ws`                     | —                 | normalized event stream       |

### `/transcript/:sessionId`

Returns the in-memory ring buffer (last 500 broadcast events) for a session.
Useful for debugging or recovering history from outside the WS pipe. The
buffer is retained for one minute after `session_end` and then pruned.

### WebSocket events

```jsonc
{ "kind": "hello",            "version": "0.2.0", "session": null }
{ "kind": "replay",           "sessionId": "…",   "events": [ /* up to 500 prior events */ ] }
{ "kind": "session_started",  "sessionId": "…",   "scenarioId": "s1-review" }
{ "kind": "stream",           "sessionId": "…",   "event": { /* parsed Claude stream-json record */ } }
{ "kind": "stream_raw",       "sessionId": "…",   "line": "non-JSON line from claude stdout" }
{ "kind": "stderr",           "sessionId": "…",   "line": "warning text from claude stderr" }
{ "kind": "hook:pre-tool-use","sessionId": "…",   "payload": { ... } }
{ "kind": "hook:subagent-stop","sessionId": "…",  "payload": { ... } }
{ "kind": "session_end",      "sessionId": "…",   "exitCode": 0, "signal": null }
{ "kind": "session_error",    "sessionId": "…",   "message": "…" }
```

`replay` is sent once, immediately after `hello`, when a client connects
while a session is in flight. It contains every event broadcast for the
current session up to the moment of connection (capped at 500). Subsequent
events arrive live as usual.

`stream` carries the structured Claude record (system, assistant, user,
tool-use, result, etc.) — refer to the Claude Code stream-json schema for
the full shape. `stream_raw` carries any stdout line that wasn't valid JSON
(occasionally Claude writes warnings outside the stream); render or ignore
as you prefer.

The hook events (`hook:*`) continue to flow exactly as before — stream
events are additive, not a replacement.

---

## Troubleshooting

**The Live toggle stays disabled.**
The app probes `/health` with a 500ms timeout on mount. Make sure the
bridge is running *before* you load the page. Refreshing the page after
starting the bridge should make it available.

**Clicking a scenario does nothing.**
Check the bridge's stdout. You should see `claude` spawn messages. If the
process exits immediately, `claude` is probably not on `PATH`.

**Hooks aren't arriving.**
`curl` is silent on failure. Test manually:

```bash
curl -s -X POST http://localhost:4001/hook/test \
  -H 'Content-Type: application/json' \
  -d '{"hello":"world"}'
```

You should see the event echo on the WebSocket stream if a client is
connected.

**No `stream` events arrive after a `/run`.**
Verify the `claude` binary itself emits stream-json:

```bash
claude --print --output-format=stream-json --verbose "say hi"
```

You should see one JSON record per line on stdout. If the binary errors
out or prints plain text, your installed Claude Code is older than the
required minimum or `--output-format=stream-json` was renamed. Older
builds will produce only `stderr` events plus a final `session_end`.

To use a non-default binary path (or a stub for testing), set
`AGENT_VIZ_CLAUDE_BIN`:

```bash
AGENT_VIZ_CLAUDE_BIN=/usr/local/bin/claude-canary node server.js
```

**I need to kill a stuck session.**

```bash
curl -X POST http://localhost:4001/abort
```

**I want to inspect everything that happened in a session.**

```bash
curl -s http://localhost:4001/transcript/<sessionId> | jq .
```

Returns the last 500 events broadcast for that session. Available for one
minute after `session_end`.

---

## Scenarios

Scripted scenario prompts live in `scenarios.js`. Edit them to customize
what gets spawned in Live mode. `demo-cwd/` holds a pre-seeded trivial
task for Scenario S3.
