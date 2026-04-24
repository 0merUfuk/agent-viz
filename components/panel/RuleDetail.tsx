"use client";

import type { Rule } from "@/lib/types";

export function RuleDetail({ rule }: { rule: Rule }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-display text-[var(--text)]">{rule.name}</h2>
        {rule.scope && (
          <p className="mt-2 text-body text-[var(--text-muted)] italic">{rule.scope}</p>
        )}
      </div>

      {rule.body && (
        <div>
          <p className="text-display-sm text-[var(--blue-bright)] mb-2">Body</p>
          <pre className="max-h-96 overflow-y-auto border border-[var(--border-subtle)] bg-[var(--void)] p-3 text-mono-sm text-[var(--text-muted)] whitespace-pre-wrap">
            {rule.body}
          </pre>
        </div>
      )}
    </div>
  );
}
