const path = require("node:path");

const DEMO_CWD = path.resolve(__dirname, "demo-cwd");

/**
 * Pre-canned scenarios for live mode.
 * Each entry returns the spawn arguments for `claude` CLI + working dir.
 */
const SCENARIOS = {
  "s1-review": {
    cwd: DEMO_CWD,
    agent: "reviewer",
    prompt: "Review the pending diff in this directory and report findings with severity.",
  },
  "s2-strategy": {
    cwd: DEMO_CWD,
    agent: null,
    prompt: "/strategy-monthly",
  },
  "s3-pipeline": {
    cwd: DEMO_CWD,
    agent: "manager",
    prompt:
      "Coordinate the full pipeline to implement the trivial task in TODO.md. " +
      "Spawn strategist, tech-lead, developer, tester, reviewer, security-reviewer, architect as needed.",
  },
};

function resolveScenario(id) {
  return SCENARIOS[id] || null;
}

module.exports = { resolveScenario, SCENARIOS, DEMO_CWD };
