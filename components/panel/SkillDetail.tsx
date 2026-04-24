"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { TabSwitch } from "@/components/ui/TabSwitch";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import type { Skill } from "@/lib/types";

type Tab = "details" | "skill";

export function SkillDetail({ skill }: { skill: Skill }) {
  const [tab, setTab] = useState<Tab>("details");
  const hasBody = !!skill.body;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-title font-[var(--font-mono)] text-[var(--blue-bright)]">/{skill.name}</h2>
        <p className="mt-2 text-body text-[var(--text-muted)]">
          {skill.description || "No description provided."}
        </p>
      </div>

      <TabSwitch<Tab>
        tabs={[
          { id: "details", label: "Details" },
          { id: "skill", label: "Skill.md", count: hasBody ? skill.body.split("\n").length : 0 },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "details" ? (
        <SkillDetailsTab skill={skill} />
      ) : hasBody ? (
        <div className="markdown-reveal">
          <MarkdownBody>{skill.body}</MarkdownBody>
        </div>
      ) : (
        <div className="border border-dashed border-[var(--border-subtle)] bg-[var(--void)] p-6 text-center">
          <p className="text-body text-[var(--text-dim)]">This skill has no body.</p>
        </div>
      )}
    </div>
  );
}

function SkillDetailsTab({ skill }: { skill: Skill }) {
  return (
    <div className="flex flex-col gap-5">
      {skill.argumentHint && (
        <div className="border-b border-[var(--border-subtle)] pb-2 flex items-baseline justify-between">
          <span className="text-display-sm text-[var(--text-dim)]">Argument</span>
          <span className="text-mono text-[var(--text)]">{skill.argumentHint}</span>
        </div>
      )}

      {skill.allowedTools.length > 0 && (
        <div>
          <p className="text-display-sm text-[var(--blue-bright)] mb-2">Allowed tools</p>
          <ul className="flex flex-wrap gap-1.5">
            {skill.allowedTools.map((t) => (
              <li
                key={t}
                className="border border-[var(--border-subtle)] bg-[var(--void)] px-2 py-0.5 text-mono-sm text-[var(--text)]"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {skill.spawnsAgents.length > 0 && (
        <div>
          <p className="text-display-sm text-[var(--gold-bright)] mb-2">Spawns agents</p>
          <div className="flex flex-wrap gap-1.5">
            {skill.spawnsAgents.map((a) => (
              <Badge key={a} tone="gold">{a}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
