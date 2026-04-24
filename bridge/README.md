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
2. `claude` CLI on your `PATH`

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

| Method | Path              | Body                         | Returns                  |
|--------|-------------------|------------------------------|--------------------------|
| GET    | `/health`         | —                            | `{status, version, session}` |
| POST   | `/run`            | `{scenarioId}`               | `{sessionId}`            |
| POST   | `/abort`          | —                            | `{aborted, sessionId}`   |
| POST   | `/hook/:kind`     | raw hook payload             | `{ok: true}`             |
| WS     | `/ws`             | —                            | normalized event stream  |

### WebSocket events

```jsonc
{ "kind": "hello",            "version": "0.1.0", "session": null }
{ "kind": "session_started",  "sessionId": "…",    "scenarioId": "s1-review" }
{ "kind": "hook:pre-tool-use","sessionId": "…",    "payload": { ... } }
{ "kind": "hook:subagent-stop","sessionId": "…",   "payload": { ... } }
{ "kind": "session_end",      "sessionId": "…",    "exitCode": 0 }
{ "kind": "session_error",    "sessionId": "…",    "message": "…" }
```

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

**I need to kill a stuck session.**

```bash
curl -X POST http://localhost:4001/abort
```

---

## Scenarios

Scripted scenario prompts live in `scenarios.js`. Edit them to customize
what gets spawned in Live mode. `demo-cwd/` holds a pre-seeded trivial
task for Scenario S3.
