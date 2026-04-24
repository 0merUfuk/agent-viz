import matter from "gray-matter";
import type { Rule } from "../types";

export interface ParseRuleInput {
  id: string;
  raw: string;
}

export function parseRule({ id, raw }: ParseRuleInput): Rule {
  const { data, content } = matter(raw);
  const name = typeof data.name === "string" ? data.name : id;

  // Derive scope from the first blockquote "> Auto-loaded when..." line, fall back
  // to the first non-heading paragraph.
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  let scope = "";
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("---")) continue;
    if (line.startsWith(">")) {
      scope = line.replace(/^>\s*/, "").replace(/^\*\*Auto-loaded\*\*/, "Auto-loaded");
      break;
    }
    scope = line;
    break;
  }

  return {
    id,
    name,
    scope,
    body: content.trim(),
  };
}
