export type ScenarioId = "s1-review" | "s2-strategy" | "s3-pipeline";

export interface Step {
  nodeIds: string[];
  edgeIds?: string[];
  durationMs: number;
  label?: string;
}

/**
 * Timeline events — the cinema layer consumes these to drive the handoff
 * strip, tool-call stream, and HUD counters. Every event also carries an
 * offset (ms from scenario start) so the UI can schedule them precisely.
 *
 * Kinds:
 *   handoff  — Agent A delegates work to Agent B with a brief.
 *   tool     — A single tool invocation (Read, Edit, Bash, Grep, Agent…).
 *   message  — Inline narration or internal reasoning note.
 *   verdict  — Final outcome (approved / blocked / escalated).
 */
export type EventKind = "handoff" | "tool" | "message" | "verdict";

export interface TimelineEvent {
  /** ms from scenario start */
  at: number;
  kind: EventKind;
  /** Agent id that is performing the action or sending the message */
  from?: string;
  /** Agent id that is receiving the handoff or returning a result */
  to?: string;
  /** Tool name — only for kind "tool" */
  tool?: string;
  /** Short human-readable content */
  content: string;
  /** Optional path / target for tool calls */
  target?: string;
  /** Verdict tone — only for kind "verdict" */
  verdict?: "approved" | "blocked" | "warning";
}

export interface Scenario {
  id: ScenarioId;
  title: string;
  subtitle: string;
  steps: Step[];
  timeline: TimelineEvent[];
}

/**
 * Scripted scenario timelines. Edge IDs follow the sample-ecosystem.json
 * convention: `sa:<skill>-><agent>` / `aa:<agent>-><agent>`.
 *
 * The `steps` field drives node + edge highlight pulses on the graph.
 * The `timeline` field drives the handoff strip and tool-call stream.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "s1-review",
    title: "Review a diff",
    subtitle: "Reviewer inspects a proposed change",
    steps: [
      { nodeIds: ["reviewer"],                           durationMs: 1400, label: "Reviewer receives diff" },
      { nodeIds: ["doublecheck"],                        durationMs: 1600, label: "Adversarial checks" },
      { nodeIds: ["reviewer", "doublecheck"], edgeIds: ["sa:doublecheck->reviewer"], durationMs: 1800, label: "Parallel passes" },
      { nodeIds: ["reviewer"],                           durationMs: 1800, label: "Verdict: APPROVED" },
    ],
    timeline: [
      { at: 100,  kind: "handoff",  from: "manager",  to: "reviewer",    content: "Review PR #184 — portal button component" },
      { at: 600,  kind: "tool",     from: "reviewer", tool: "Read",      target: "components/ui/PortalButton.tsx", content: "Read portal button source" },
      { at: 1200, kind: "tool",     from: "reviewer", tool: "Read",      target: "app/globals.css", content: "Read style tokens" },
      { at: 1800, kind: "tool",     from: "reviewer", tool: "Grep",      target: "portal-btn", content: "Locate class usages across app" },
      { at: 2400, kind: "message",  from: "reviewer",                    content: "Found 3 usages. Prompt scope looks clean." },
      { at: 3000, kind: "tool",     from: "reviewer", tool: "Bash",      target: "npm run build", content: "Verify build still passes" },
      { at: 3700, kind: "message",  from: "reviewer",                    content: "Build OK — 1.7s, 0 warnings." },
      { at: 4300, kind: "tool",     from: "reviewer", tool: "Agent",     target: "doublecheck", content: "Spawn adversarial checks subagent" },
      { at: 4900, kind: "message",  from: "doublecheck",                 content: "Edge case: prefers-reduced-motion respected ✓" },
      { at: 5400, kind: "message",  from: "doublecheck",                 content: "Edge case: disabled state has aria-disabled ✓" },
      { at: 6000, kind: "verdict",  from: "reviewer", to: "manager",     verdict: "approved", content: "APPROVED · confidence 97%" },
    ],
  },
  {
    id: "s2-strategy",
    title: "Strategy review",
    subtitle: "Monthly review with three lead agents",
    steps: [
      { nodeIds: ["strategy-monthly"],                   durationMs: 1400, label: "/strategy-monthly invoked" },
      {
        nodeIds: ["strategy-monthly", "product-lead", "tech-lead", "growth-lead"],
        edgeIds: [
          "sa:strategy-monthly->product-lead",
          "sa:strategy-monthly->tech-lead",
          "sa:strategy-monthly->growth-lead",
        ],
        durationMs: 2400,
        label: "Fan out to three leads",
      },
      {
        nodeIds: ["product-lead", "tech-lead", "growth-lead"],
        durationMs: 2600,
        label: "Parallel assessments",
      },
      { nodeIds: ["strategy-monthly"],                   durationMs: 2000, label: "Synthesized report" },
    ],
    timeline: [
      { at: 0,     kind: "message",  from: "strategy-monthly",           content: "Monthly review cadence — 30 days since last run" },
      { at: 500,   kind: "handoff",  from: "strategy-monthly", to: "product-lead",  content: "Assess priorities, kill criteria, pivot signals" },
      { at: 900,   kind: "handoff",  from: "strategy-monthly", to: "tech-lead",     content: "Audit architecture drift, dependency health, test coverage" },
      { at: 1300,  kind: "handoff",  from: "strategy-monthly", to: "growth-lead",   content: "Review channels, content pipeline, retention" },
      { at: 2000,  kind: "tool",     from: "product-lead",     tool: "Read",        target: ".claude/NEXT_STEPS.md", content: "Read current roadmap" },
      { at: 2400,  kind: "tool",     from: "tech-lead",        tool: "Bash",        target: "govulncheck ./...", content: "Scan for vulnerable deps" },
      { at: 2800,  kind: "tool",     from: "growth-lead",      tool: "WebFetch",    target: "ASO metrics", content: "Fetch app store rankings" },
      { at: 3400,  kind: "tool",     from: "product-lead",     tool: "Read",        target: ".claude/DECISIONS.md", content: "Review recent ADRs" },
      { at: 3900,  kind: "tool",     from: "tech-lead",        tool: "Bash",        target: "go test ./... -cover", content: "Measure coverage delta" },
      { at: 4300,  kind: "tool",     from: "growth-lead",      tool: "WebSearch",   target: "competitor releases", content: "Scan competitor surface area" },
      { at: 4900,  kind: "message",  from: "tech-lead",                             content: "Coverage 74% · 2 deprecated deps flagged · no criticals" },
      { at: 5300,  kind: "message",  from: "product-lead",                          content: "Pivot criterion hit on Stream 3 — deprioritize" },
      { at: 5700,  kind: "message",  from: "growth-lead",                           content: "Retention up 11% · channel B underperforming" },
      { at: 6300,  kind: "handoff",  from: "product-lead",     to: "strategy-monthly", content: "Assessment complete" },
      { at: 6700,  kind: "handoff",  from: "tech-lead",        to: "strategy-monthly", content: "Assessment complete" },
      { at: 7100,  kind: "handoff",  from: "growth-lead",      to: "strategy-monthly", content: "Assessment complete" },
      { at: 7700,  kind: "verdict",  from: "strategy-monthly", to: "manager",       verdict: "approved", content: "Report synthesized · 3 priority shifts queued" },
    ],
  },
  {
    id: "s3-pipeline",
    title: "Dev pipeline",
    subtitle: "Full 7-agent feature delivery",
    steps: [
      { nodeIds: ["strategist"],                                              durationMs: 1800, label: "Research & brief" },
      { nodeIds: ["strategist", "manager"], edgeIds: ["aa:manager->strategist"], durationMs: 1600, label: "Handoff to manager" },
      {
        nodeIds: ["manager", "tech-lead", "developer"],
        edgeIds: ["aa:manager->tech-lead", "aa:manager->developer"],
        durationMs: 2000,
        label: "Design + implement",
      },
      { nodeIds: ["developer", "tester"], edgeIds: ["aa:manager->tester"],   durationMs: 2000, label: "Test & validate" },
      { nodeIds: ["tester", "reviewer"], edgeIds: ["aa:manager->reviewer"],  durationMs: 2000, label: "Quality gate" },
      {
        nodeIds: ["reviewer", "security-reviewer"],
        edgeIds: ["aa:manager->security-reviewer"],
        durationMs: 2000,
        label: "Security gate",
      },
      {
        nodeIds: ["security-reviewer", "architect"],
        edgeIds: ["aa:manager->architect"],
        durationMs: 2000,
        label: "Provision follow-ups",
      },
      { nodeIds: ["architect", "manager"],                                    durationMs: 1600, label: "Ship PR" },
      { nodeIds: ["manager"],                                                 durationMs: 1400, label: "Complete" },
    ],
    timeline: [
      { at: 0,      kind: "message", from: "strategist",                                          content: "Received feature brief: portal-button redesign" },
      { at: 400,    kind: "tool",    from: "strategist",       tool: "WebSearch",                 content: "Research gold-accent CTA patterns" },
      { at: 900,    kind: "tool",    from: "strategist",       tool: "WebFetch",  target: "DESIGN.md §15", content: "Pull design token spec" },
      { at: 1500,   kind: "handoff", from: "strategist",       to: "manager",                     content: "Brief drafted — 3 approaches, recommendation attached" },

      { at: 2000,   kind: "handoff", from: "manager",          to: "tech-lead",                   content: "Audit impact on existing Button variants" },
      { at: 2400,   kind: "tool",    from: "tech-lead",        tool: "Grep",      target: "Button variant",     content: "Survey variant usage" },
      { at: 2900,   kind: "tool",    from: "tech-lead",        tool: "Read",      target: "components/ui/Button.tsx", content: "Review current component" },
      { at: 3300,   kind: "message", from: "tech-lead",                                            content: "No breaking change — portal is orthogonal to Button" },

      { at: 3700,   kind: "handoff", from: "manager",          to: "developer",                   content: "Implement PortalButton with breathing border" },
      { at: 4200,   kind: "tool",    from: "developer",        tool: "Read",      target: "app/globals.css",    content: "Read existing keyframes" },
      { at: 4700,   kind: "tool",    from: "developer",        tool: "Write",     target: "components/ui/PortalButton.tsx", content: "Create new component" },
      { at: 5200,   kind: "tool",    from: "developer",        tool: "Edit",      target: "app/globals.css",    content: "Add portal-breath / portal-flare keyframes" },
      { at: 5700,   kind: "tool",    from: "developer",        tool: "Bash",      target: "npm run build",      content: "Verify TypeScript compilation" },
      { at: 6100,   kind: "message", from: "developer",                                            content: "✓ Compiled in 1.4s · 0 errors" },

      { at: 6400,   kind: "handoff", from: "manager",          to: "tester",                      content: "Validate interaction states + a11y" },
      { at: 6800,   kind: "tool",    from: "tester",           tool: "Read",      target: "components/ui/PortalButton.tsx", content: "Read implementation" },
      { at: 7300,   kind: "tool",    from: "tester",           tool: "Write",     target: "tests/portal-button.test.tsx", content: "Write coverage suite" },
      { at: 7800,   kind: "tool",    from: "tester",           tool: "Bash",      target: "npm test -- portal", content: "Run tests" },
      { at: 8200,   kind: "message", from: "tester",                                               content: "12 tests passing · loading / disabled / hover covered" },

      { at: 8500,   kind: "handoff", from: "manager",          to: "reviewer",                    content: "Quality gate — review against DESIGN.md §15" },
      { at: 8900,   kind: "tool",    from: "reviewer",         tool: "Read",      target: "DESIGN.md",          content: "Compare against spec" },
      { at: 9400,   kind: "tool",    from: "reviewer",         tool: "Grep",      target: "aria-",              content: "Verify a11y attributes" },
      { at: 9900,   kind: "message", from: "reviewer",                                             content: "Matches spec · a11y clean · confidence 96%" },

      { at: 10400,  kind: "handoff", from: "manager",          to: "security-reviewer",           content: "ASI + OWASP scan on PR #184" },
      { at: 10800,  kind: "tool",    from: "security-reviewer", tool: "Grep",     target: "dangerouslySetInnerHTML", content: "Scan for injection surfaces" },
      { at: 11300,  kind: "tool",    from: "security-reviewer", tool: "Bash",     target: "npm audit",           content: "Audit transitive deps" },
      { at: 11800,  kind: "message", from: "security-reviewer",                                    content: "No injection surface · no new vulns · SECURITY_APPROVED" },

      { at: 12200,  kind: "handoff", from: "manager",          to: "architect",                   content: "Any provisioning follow-ups?" },
      { at: 12600,  kind: "tool",    from: "architect",        tool: "Read",      target: ".claude/DECISIONS.md", content: "Check ADR implications" },
      { at: 13100,  kind: "message", from: "architect",                                            content: "No ADR needed — within existing D-014 scope" },

      { at: 13500,  kind: "tool",    from: "manager",          tool: "Bash",      target: "git push origin feat/portal-button", content: "Push branch" },
      { at: 14000,  kind: "tool",    from: "manager",          tool: "Agent",     target: "create_pull_request", content: "Open PR via GitHub MCP" },
      { at: 14500,  kind: "verdict", from: "manager",          to: "strategist",  verdict: "approved", content: "SHIPPED · PR #184 · review passed · security approved" },
    ],
  },
];

export function findScenario(id: ScenarioId): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
