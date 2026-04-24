export type ScenarioId = "s1-review" | "s2-strategy" | "s3-pipeline";

export interface Step {
  nodeIds: string[];
  edgeIds?: string[];
  durationMs: number;
  label?: string;
}

export interface Scenario {
  id: ScenarioId;
  title: string;
  subtitle: string;
  steps: Step[];
}

/**
 * Scripted scenario timelines. Edge IDs follow the sample-ecosystem.json
 * convention: `sa:<skill>-><agent>` / `aa:<agent>-><agent>`.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "s1-review",
    title: "Review a diff",
    subtitle: "Reviewer inspects a proposed change",
    steps: [
      { nodeIds: ["reviewer"],                           durationMs: 1200, label: "Reviewer starts" },
      { nodeIds: ["doublecheck"],                        durationMs: 1400, label: "Runs adversarial checks" },
      { nodeIds: ["reviewer", "doublecheck"], edgeIds: ["sa:doublecheck->reviewer"], durationMs: 1600, label: "Parallel passes" },
      { nodeIds: ["reviewer"],                           durationMs: 1600, label: "Verdict: APPROVED" },
    ],
  },
  {
    id: "s2-strategy",
    title: "Strategy review",
    subtitle: "Monthly review with three lead agents",
    steps: [
      { nodeIds: ["strategy-monthly"],                   durationMs: 1200, label: "/strategy-monthly invoked" },
      {
        nodeIds: ["strategy-monthly", "product-lead", "tech-lead", "growth-lead"],
        edgeIds: [
          "sa:strategy-monthly->product-lead",
          "sa:strategy-monthly->tech-lead",
          "sa:strategy-monthly->growth-lead",
        ],
        durationMs: 2200,
        label: "Fan out to leads",
      },
      {
        nodeIds: ["product-lead", "tech-lead", "growth-lead"],
        durationMs: 2200,
        label: "Parallel assessments",
      },
      { nodeIds: ["strategy-monthly"],                   durationMs: 1800, label: "Synthesized report" },
    ],
  },
  {
    id: "s3-pipeline",
    title: "Dev pipeline",
    subtitle: "Full 8-agent feature delivery",
    steps: [
      { nodeIds: ["strategist"],                                              durationMs: 1400, label: "Research & brief" },
      { nodeIds: ["strategist", "manager"], edgeIds: ["aa:manager->strategist"], durationMs: 1400, label: "Handoff to manager" },
      {
        nodeIds: ["manager", "tech-lead", "developer"],
        edgeIds: ["aa:manager->tech-lead", "aa:manager->developer"],
        durationMs: 1800,
        label: "Design + scaffold",
      },
      { nodeIds: ["developer", "tester"], edgeIds: ["aa:manager->tester"],   durationMs: 1600, label: "Validate" },
      { nodeIds: ["tester", "reviewer"], edgeIds: ["aa:manager->reviewer"],  durationMs: 1600, label: "Quality gate" },
      {
        nodeIds: ["reviewer", "security-reviewer"],
        edgeIds: ["aa:manager->security-reviewer"],
        durationMs: 1600,
        label: "Security gate",
      },
      {
        nodeIds: ["security-reviewer", "architect"],
        edgeIds: ["aa:manager->architect"],
        durationMs: 1600,
        label: "Provision follow-ups",
      },
      { nodeIds: ["architect", "manager"],                                    durationMs: 1600, label: "Ship PR" },
      { nodeIds: ["manager"],                                                 durationMs: 1400, label: "Complete" },
    ],
  },
];

export function findScenario(id: ScenarioId): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
