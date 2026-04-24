"use client";

import { MarkdownBody } from "@/components/ui/MarkdownBody";
import type { Rule } from "@/lib/types";

export function RuleDetail({ rule }: { rule: Rule }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-display text-[var(--text)]">{rule.name}</h2>
        {rule.scope && (
          <p className="mt-2 text-body text-[var(--text-muted)] italic">{rule.scope}</p>
        )}
      </div>

      {rule.body ? (
        <div className="markdown-reveal">
          <MarkdownBody>{rule.body}</MarkdownBody>
        </div>
      ) : (
        <div className="border border-dashed border-[var(--border-subtle)] bg-[var(--void)] p-6 text-center">
          <p className="text-body text-[var(--text-dim)]">This rule has no body.</p>
        </div>
      )}
    </div>
  );
}
