"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Agent } from "@/lib/types";

export function AgentDetail({ agent }: { agent: Agent }) {
  const [bodyOpen, setBodyOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-title text-[var(--gold-bright)]">{agent.name}</h2>
        <p className="mt-2 text-body text-[var(--text-muted)]">{agent.description || "No description provided."}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone={agent.model === "opus" ? "gold" : "cyan"}>
          {agent.model === "unknown" ? "Model n/a" : agent.model}
        </Badge>
        <Badge tone={agent.capability === "read-only" ? "cyan" : "gold"}>
          {agent.capability}
        </Badge>
        {agent.canSpawnAgents && <Badge tone="cyan">orchestrator</Badge>}
        {agent.isolation === "worktree" && <Badge tone="muted">worktree</Badge>}
        {agent.memory === "project" && <Badge tone="muted">memory: project</Badge>}
      </div>

      <DetailRow label="Max turns" value={agent.maxTurns ? String(agent.maxTurns) : "—"} />
      {agent.permissionMode && (
        <DetailRow label="Permission mode" value={agent.permissionMode} />
      )}

      <Section title="Tools">
        {agent.tools.length === 0 ? (
          <p className="text-body text-[var(--text-dim)]">None declared.</p>
        ) : (
          <MonoList items={agent.tools} />
        )}
      </Section>

      {agent.disallowedTools.length > 0 && (
        <Section title="Disallowed">
          <MonoList items={agent.disallowedTools} muted />
        </Section>
      )}

      {agent.spawnTargets.length > 0 && (
        <Section title="Spawns">
          <div className="flex flex-wrap gap-1.5">
            {agent.spawnTargets.map((t) => (
              <Badge key={t} tone="cyan">{t}</Badge>
            ))}
          </div>
        </Section>
      )}

      {agent.promptBody && (
        <div>
          <button
            type="button"
            onClick={() => setBodyOpen((v) => !v)}
            className="flex w-full items-center justify-between border-t border-[var(--border-subtle)] py-2 text-display-sm text-[var(--blue-bright)] hover:text-[var(--blue-star)]"
          >
            <span>Prompt body</span>
            {bodyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {bodyOpen && (
            <pre className="mt-2 max-h-72 overflow-y-auto border border-[var(--border-subtle)] bg-[var(--void)] p-3 text-mono-sm text-[var(--text-muted)] whitespace-pre-wrap">
              {agent.promptBody}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--border-subtle)] pb-2">
      <span className="text-display-sm text-[var(--text-dim)]">{label}</span>
      <span className="text-body text-[var(--text)]">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-display-sm text-[var(--blue-bright)] mb-2">{title}</p>
      {children}
    </div>
  );
}

function MonoList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="border border-[var(--border-subtle)] bg-[var(--void)] px-2 py-0.5 text-mono-sm"
          style={{ color: muted ? "var(--text-dim)" : "var(--text)" }}
        >
          {t}
        </li>
      ))}
    </ul>
  );
}
