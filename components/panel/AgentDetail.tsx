"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { TabSwitch } from "@/components/ui/TabSwitch";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import type { Agent } from "@/lib/types";

type Tab = "details" | "prompt";

export function AgentDetail({ agent }: { agent: Agent }) {
  const [tab, setTab] = useState<Tab>("details");
  const hasPrompt = !!agent.promptBody;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-title text-[var(--gold-bright)]">{agent.name}</h2>
        <p className="mt-2 text-body text-[var(--text-muted)]">
          {agent.description || "No description provided."}
        </p>
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

      <TabSwitch<Tab>
        tabs={[
          { id: "details", label: "Details" },
          { id: "prompt", label: "Prompt", count: hasPrompt ? agent.promptBody.split("\n").length : 0 },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "details" ? (
        <AgentDetailsTab agent={agent} />
      ) : (
        <AgentPromptTab agent={agent} />
      )}
    </div>
  );
}

function AgentDetailsTab({ agent }: { agent: Agent }) {
  return (
    <div className="flex flex-col gap-5">
      <DetailRow label="Max turns" value={agent.maxTurns ? String(agent.maxTurns) : "—"} />
      {agent.permissionMode && <DetailRow label="Permission" value={agent.permissionMode} />}

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
    </div>
  );
}

function AgentPromptTab({ agent }: { agent: Agent }) {
  if (!agent.promptBody) {
    return (
      <div className="border border-dashed border-[var(--border-subtle)] bg-[var(--void)] p-6 text-center">
        <p className="text-body text-[var(--text-dim)]">
          This agent has no prompt body.
        </p>
      </div>
    );
  }
  return (
    <div className="markdown-reveal">
      <MarkdownBody>{agent.promptBody}</MarkdownBody>
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
