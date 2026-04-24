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
 *
 * Pacing
 * ------
 * Scenarios are authored to run 30–60s end-to-end so the audience can feel
 * the weight of each process step. Gaps are deliberate: a Bash build takes
 * wall-clock seconds in reality, so we let it take wall-clock seconds here
 * before the success message lands. Under prefers-reduced-motion, the
 * EventStreamProvider compresses everything to 35%.
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
      { nodeIds: ["reviewer"],                           durationMs: 6000,  label: "Reviewer receives diff" },
      { nodeIds: ["doublecheck"],                        durationMs: 8000,  label: "Reading & cross-reference" },
      { nodeIds: ["reviewer", "doublecheck"], edgeIds: ["sa:doublecheck->reviewer"], durationMs: 15000, label: "Build + parallel checks" },
      { nodeIds: ["reviewer"],                           durationMs: 4000,  label: "Verdict: APPROVED" },
    ],
    timeline: [
      { at: 500,   kind: "handoff",  from: "manager",     to: "reviewer",    content: "Review PR #184 — portal button component" },
      { at: 2000,  kind: "tool",     from: "reviewer",    tool: "Read",      target: "components/ui/PortalButton.tsx", content: "Read portal button source" },
      { at: 4200,  kind: "tool",     from: "reviewer",    tool: "Read",      target: "app/globals.css", content: "Read style tokens" },
      { at: 6500,  kind: "message",  from: "reviewer",                       content: "Cross-referencing against DESIGN.md §15 spec" },
      { at: 8800,  kind: "tool",     from: "reviewer",    tool: "Grep",      target: "portal-btn", content: "Locate class usages across app" },
      { at: 10800, kind: "tool",     from: "reviewer",    tool: "Read",      target: "components/shell/Header.tsx", content: "Verify usage in header" },
      { at: 12800, kind: "message",  from: "reviewer",                       content: "Found 3 usages · scope clean · no regressions" },
      { at: 14800, kind: "tool",     from: "reviewer",    tool: "Bash",      target: "npm run build", content: "Verify build still passes" },
      { at: 19200, kind: "message",  from: "reviewer",                       content: "Build OK · 2.3s compile · 0 warnings · 0 errors" },
      { at: 20800, kind: "tool",     from: "reviewer",    tool: "Agent",     target: "doublecheck", content: "Spawn adversarial checks subagent" },
      { at: 22800, kind: "message",  from: "doublecheck",                    content: "Running adversarial edge-case suite" },
      { at: 24800, kind: "message",  from: "doublecheck",                    content: "Edge case: prefers-reduced-motion respected ✓" },
      { at: 26600, kind: "message",  from: "doublecheck",                    content: "Edge case: disabled state has aria-disabled=true ✓" },
      { at: 28400, kind: "message",  from: "doublecheck",                    content: "Edge case: focus ring visible against void ✓" },
      { at: 30200, kind: "message",  from: "doublecheck",                    content: "Edge case: breathing pauses under reduced-motion ✓" },
      { at: 32500, kind: "verdict",  from: "reviewer",    to: "manager",     verdict: "approved", content: "APPROVED · confidence 97%" },
    ],
  },
  {
    id: "s2-strategy",
    title: "Strategy review",
    subtitle: "Monthly review with three lead agents",
    steps: [
      { nodeIds: ["strategy-monthly"],                   durationMs: 4500,  label: "/strategy-monthly invoked" },
      {
        nodeIds: ["strategy-monthly", "product-lead", "tech-lead", "growth-lead"],
        edgeIds: [
          "sa:strategy-monthly->product-lead",
          "sa:strategy-monthly->tech-lead",
          "sa:strategy-monthly->growth-lead",
        ],
        durationMs: 3500,
        label: "Fan out to three leads",
      },
      {
        nodeIds: ["product-lead", "tech-lead", "growth-lead"],
        durationMs: 22000,
        label: "Parallel assessments",
      },
      { nodeIds: ["strategy-monthly"],                   durationMs: 15000, label: "Synthesized report" },
    ],
    timeline: [
      { at: 500,    kind: "message",  from: "strategy-monthly",                                content: "Monthly cadence triggered — 30 days since last run" },
      { at: 2200,   kind: "message",  from: "strategy-monthly",                                content: "Fanning out to product / tech / growth leads" },

      { at: 4000,   kind: "handoff",  from: "strategy-monthly",  to: "product-lead",           content: "Assess priorities, kill criteria, pivot signals" },
      { at: 4900,   kind: "handoff",  from: "strategy-monthly",  to: "tech-lead",              content: "Audit architecture drift, dependency health, test coverage" },
      { at: 5800,   kind: "handoff",  from: "strategy-monthly",  to: "growth-lead",            content: "Review channels, content pipeline, retention" },

      { at: 8000,   kind: "tool",     from: "product-lead",      tool: "Read",                 target: ".claude/NEXT_STEPS.md", content: "Read current roadmap" },
      { at: 9200,   kind: "tool",     from: "tech-lead",         tool: "Bash",                 target: "govulncheck ./...", content: "Scan for vulnerable deps" },
      { at: 10400,  kind: "tool",     from: "growth-lead",       tool: "WebFetch",             target: "App Store Connect", content: "Fetch ASO metrics" },

      { at: 13000,  kind: "tool",     from: "product-lead",      tool: "Read",                 target: ".claude/DECISIONS.md", content: "Review recent ADRs" },
      { at: 14500,  kind: "tool",     from: "tech-lead",         tool: "Bash",                 target: "go test ./... -cover", content: "Measure coverage delta" },
      { at: 16000,  kind: "tool",     from: "growth-lead",       tool: "WebSearch",            target: "competitor releases 2026", content: "Scan competitor surface area" },

      { at: 18500,  kind: "tool",     from: "product-lead",      tool: "Agent",                target: "market-research", content: "Spawn market intelligence subagent" },
      { at: 20000,  kind: "tool",     from: "tech-lead",         tool: "Read",                 target: "internal/neo/registry.go", content: "Review architecture hotspot" },
      { at: 21500,  kind: "tool",     from: "growth-lead",       tool: "WebFetch",             target: "content-calendar.yaml", content: "Audit content pipeline" },

      { at: 24500,  kind: "message",  from: "product-lead",                                     content: "Pivot criterion hit on Stream 3 — 2 priority shifts queued" },
      { at: 26500,  kind: "message",  from: "tech-lead",                                        content: "Coverage 74% (+3%) · 2 deprecated deps flagged · no criticals" },
      { at: 28500,  kind: "message",  from: "growth-lead",                                      content: "Retention +11% · channel B underperforming · cadence steady" },

      { at: 31000,  kind: "handoff",  from: "product-lead",      to: "strategy-monthly",       content: "Assessment complete · 14 findings" },
      { at: 32200,  kind: "handoff",  from: "tech-lead",         to: "strategy-monthly",       content: "Assessment complete · 9 findings" },
      { at: 33400,  kind: "handoff",  from: "growth-lead",       to: "strategy-monthly",       content: "Assessment complete · 11 findings" },

      { at: 35500,  kind: "message",  from: "strategy-monthly",                                 content: "Synthesizing three assessments against roadmap" },
      { at: 38500,  kind: "message",  from: "strategy-monthly",                                 content: "Reconciling recommendations and priority drift" },
      { at: 41500,  kind: "message",  from: "strategy-monthly",                                 content: "3 priority shifts · 1 pivot trigger · 0 kill criteria hit" },

      { at: 44500,  kind: "verdict",  from: "strategy-monthly",  to: "manager",                verdict: "approved", content: "Report synthesized · 3 priority shifts queued" },
    ],
  },
  {
    id: "s3-pipeline",
    title: "Dev pipeline",
    subtitle: "Full 7-agent feature delivery",
    steps: [
      { nodeIds: ["strategist"],                                              durationMs: 6700, label: "Research & brief" },
      { nodeIds: ["strategist", "manager"], edgeIds: ["aa:manager->strategist"], durationMs: 6000, label: "Handoff to manager" },
      {
        nodeIds: ["manager", "tech-lead", "developer"],
        edgeIds: ["aa:manager->tech-lead", "aa:manager->developer"],
        durationMs: 7400,
        label: "Design + implement",
      },
      { nodeIds: ["developer", "tester"], edgeIds: ["aa:manager->tester"],   durationMs: 7400, label: "Test & validate" },
      { nodeIds: ["tester", "reviewer"], edgeIds: ["aa:manager->reviewer"],  durationMs: 7400, label: "Quality gate" },
      {
        nodeIds: ["reviewer", "security-reviewer"],
        edgeIds: ["aa:manager->security-reviewer"],
        durationMs: 7400,
        label: "Security gate",
      },
      {
        nodeIds: ["security-reviewer", "architect"],
        edgeIds: ["aa:manager->architect"],
        durationMs: 7400,
        label: "Provision follow-ups",
      },
      { nodeIds: ["architect", "manager"],                                    durationMs: 6000, label: "Ship PR" },
      { nodeIds: ["manager"],                                                 durationMs: 5200, label: "Complete" },
    ],
    timeline: [
      { at: 0,      kind: "message",  from: "strategist",                                           content: "Received feature brief: portal-button redesign" },
      { at: 1500,   kind: "tool",     from: "strategist",        tool: "WebSearch",                 content: "Research gold-accent CTA patterns" },
      { at: 3300,   kind: "tool",     from: "strategist",        tool: "WebFetch",  target: "DESIGN.md §15", content: "Pull design token spec" },
      { at: 5500,   kind: "handoff",  from: "strategist",        to: "manager",                     content: "Brief drafted · 3 approaches · recommendation attached" },

      { at: 7400,   kind: "handoff",  from: "manager",           to: "tech-lead",                   content: "Audit impact on existing Button variants" },
      { at: 8900,   kind: "tool",     from: "tech-lead",         tool: "Grep",      target: "Button variant", content: "Survey variant usage" },
      { at: 10700,  kind: "tool",     from: "tech-lead",         tool: "Read",      target: "components/ui/Button.tsx", content: "Review current component" },
      { at: 12200,  kind: "message",  from: "tech-lead",                                             content: "No breaking change — portal is orthogonal to Button" },

      { at: 13700,  kind: "handoff",  from: "manager",           to: "developer",                   content: "Implement PortalButton with breathing border" },
      { at: 15500,  kind: "tool",     from: "developer",         tool: "Read",      target: "app/globals.css", content: "Read existing keyframes" },
      { at: 17400,  kind: "tool",     from: "developer",         tool: "Write",     target: "components/ui/PortalButton.tsx", content: "Create new component" },
      { at: 19200,  kind: "tool",     from: "developer",         tool: "Edit",      target: "app/globals.css", content: "Add portal-breath / portal-flare keyframes" },
      { at: 21100,  kind: "tool",     from: "developer",         tool: "Bash",      target: "npm run build", content: "Verify TypeScript compilation" },
      { at: 22600,  kind: "message",  from: "developer",                                             content: "✓ Compiled in 1.4s · 0 errors" },

      { at: 23700,  kind: "handoff",  from: "manager",           to: "tester",                      content: "Validate interaction states + a11y" },
      { at: 25200,  kind: "tool",     from: "tester",            tool: "Read",      target: "components/ui/PortalButton.tsx", content: "Read implementation" },
      { at: 27000,  kind: "tool",     from: "tester",            tool: "Write",     target: "tests/portal-button.test.tsx", content: "Write coverage suite" },
      { at: 28900,  kind: "tool",     from: "tester",            tool: "Bash",      target: "npm test -- portal", content: "Run tests" },
      { at: 30300,  kind: "message",  from: "tester",                                                content: "12 tests passing · loading / disabled / hover covered" },

      { at: 31500,  kind: "handoff",  from: "manager",           to: "reviewer",                    content: "Quality gate — review against DESIGN.md §15" },
      { at: 32900,  kind: "tool",     from: "reviewer",          tool: "Read",      target: "DESIGN.md", content: "Compare against spec" },
      { at: 34800,  kind: "tool",     from: "reviewer",          tool: "Grep",      target: "aria-",     content: "Verify a11y attributes" },
      { at: 36600,  kind: "message",  from: "reviewer",                                                content: "Matches spec · a11y clean · confidence 96%" },

      { at: 38500,  kind: "handoff",  from: "manager",           to: "security-reviewer",           content: "ASI + OWASP scan on PR #184" },
      { at: 40000,  kind: "tool",     from: "security-reviewer", tool: "Grep",      target: "dangerouslySetInnerHTML", content: "Scan for injection surfaces" },
      { at: 41800,  kind: "tool",     from: "security-reviewer", tool: "Bash",      target: "npm audit", content: "Audit transitive deps" },
      { at: 43700,  kind: "message",  from: "security-reviewer",                                      content: "No injection surface · no new vulns · SECURITY_APPROVED" },

      { at: 45100,  kind: "handoff",  from: "manager",           to: "architect",                   content: "Any provisioning follow-ups?" },
      { at: 46600,  kind: "tool",     from: "architect",         tool: "Read",      target: ".claude/DECISIONS.md", content: "Check ADR implications" },
      { at: 48500,  kind: "message",  from: "architect",                                              content: "No ADR needed — within existing D-014 scope" },

      { at: 50000,  kind: "tool",     from: "manager",           tool: "Bash",      target: "git push origin feat/portal-button", content: "Push branch" },
      { at: 51800,  kind: "tool",     from: "manager",           tool: "Agent",     target: "create_pull_request", content: "Open PR via GitHub MCP" },
      { at: 53700,  kind: "verdict",  from: "manager",           to: "strategist",  verdict: "approved", content: "SHIPPED · PR #184 · review passed · security approved" },
    ],
  },
];

export function findScenario(id: ScenarioId): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
