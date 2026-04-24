/**
 * WebSocket client for the local agent-viz bridge.
 * Auto-reconnects with a small backoff.
 */

export interface BridgeEvent {
  kind: string;
  sessionId?: string | null;
  scenarioId?: string;
  payload?: unknown;
  message?: string;
  exitCode?: number | null;
  version?: string;
  ts?: number;
}

export type BridgeListener = (event: BridgeEvent) => void;

const DEFAULT_URL = "ws://localhost:4001/ws";
const HEALTH_URL = "http://localhost:4001/health";

export async function probeBridge(timeoutMs = 500): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(HEALTH_URL, {
      method: "GET",
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export async function runScenario(scenarioId: string): Promise<{
  ok: boolean;
  sessionId?: string;
  error?: string;
}> {
  try {
    const res = await fetch("http://localhost:4001/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
    return { ok: true, sessionId: data.sessionId };
  } catch (err) {
    return { ok: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function abortBridge(): Promise<void> {
  try {
    await fetch("http://localhost:4001/abort", { method: "POST" });
  } catch {
    /* noop */
  }
}

export class BridgeClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<BridgeListener>();
  private closed = false;
  private backoffMs = 500;
  private url: string;

  constructor(url: string = DEFAULT_URL) {
    this.url = url;
  }

  connect() {
    if (this.closed) return;
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this.backoffMs = 500;
    };
    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as BridgeEvent;
        for (const l of this.listeners) l(data);
      } catch {
        /* ignore */
      }
    };
    this.ws.onerror = () => {
      try { this.ws?.close(); } catch { /* noop */ }
    };
    this.ws.onclose = () => {
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.closed) return;
    const delay = Math.min(this.backoffMs, 4000);
    this.backoffMs = Math.min(this.backoffMs * 2, 4000);
    setTimeout(() => this.connect(), delay);
  }

  subscribe(listener: BridgeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    this.closed = true;
    try { this.ws?.close(); } catch { /* noop */ }
    this.listeners.clear();
  }
}
