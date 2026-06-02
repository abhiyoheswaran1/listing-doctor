import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("AI harness", () => {
  it("documents overnight agent roles and exposes a local audit command", () => {
    const requiredFiles = [
      "docs/ai-harness/README.md",
      "docs/ai-harness/agent-briefs.md",
      "docs/ai-harness/overnight-plan.md",
      "docs/ai-harness/review-rubric.md",
      "docs/ai-harness/hourly-reports/README.md",
      "scripts/ai-harness/audit-listing-doctor.mjs",
      "scripts/ai-harness/create-hourly-report.mjs",
    ];

    for (const file of requiredFiles) {
      expect(existsSync(join(repoRoot, file)), `${file} should exist`).toBe(true);
    }

    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts["ai:audit"]).toBe(
      "node scripts/ai-harness/audit-listing-doctor.mjs",
    );
    expect(packageJson.scripts["ai:hourly-report"]).toBe(
      "node scripts/ai-harness/create-hourly-report.mjs",
    );

    const agentBriefs = readRepoFile("docs/ai-harness/agent-briefs.md");
    expect(agentBriefs).toContain("Scoring Engine Agent");
    expect(agentBriefs).toContain("Mock Market Data Agent");
    expect(agentBriefs).toContain("Documentation Steward Agent");
    expect(agentBriefs).toContain("Forbidden");

    const overnightPlan = readRepoFile("docs/ai-harness/overnight-plan.md");
    expect(overnightPlan).toContain("npm run ai:audit");
    expect(overnightPlan).toContain("hourly report");
    expect(overnightPlan).toContain("Stop conditions");
  });
});
