#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const results = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function fileExists(path) {
  return existsSync(join(root, path));
}

function check(name, condition, detail = "") {
  results.push({ name, passed: Boolean(condition), detail });
}

function includes(path, text) {
  return read(path).includes(text);
}

const requiredFiles = [
  "app/api/diagnose-listing/route.ts",
  "components/listing-doctor/listing-doctor-app.tsx",
  "components/listing-doctor/live-doctor-panel.tsx",
  "components/listing-doctor/diagnosis-panel.tsx",
  "lib/listing-doctor/analyze.ts",
  "lib/listing-doctor/generateReport.ts",
  "lib/listing-doctor/descriptionAssistant.ts",
  "lib/listing-doctor/descriptionStaleness.ts",
  "lib/listing-doctor/predictiveInsights.ts",
  "lib/listing-doctor/pastListings.ts",
  "docs/hackathon-internal-reference.md",
  "docs/ai-harness/README.md",
  "docs/ai-harness/agent-briefs.md",
  "docs/ai-harness/overnight-plan.md",
  "docs/ai-harness/review-rubric.md",
  "docs/ai-harness/hourly-reports/README.md",
  "scripts/ai-harness/create-hourly-report.mjs",
];

for (const path of requiredFiles) {
  check(`required file exists: ${path}`, fileExists(path));
}

const packageJson = JSON.parse(read("package.json"));
check(
  "package exposes ai:audit",
  packageJson.scripts?.["ai:audit"] === "node scripts/ai-harness/audit-listing-doctor.mjs",
);
check(
  "package exposes ai:hourly-report",
  packageJson.scripts?.["ai:hourly-report"] === "node scripts/ai-harness/create-hourly-report.mjs",
);

check(
  "manual API route exists",
  fileExists("app/api/diagnose-listing/route.ts"),
);
check(
  "URL diagnosis route is not present",
  !fileExists("app/api/diagnose-url/route.ts"),
  "URL diagnosis was intentionally removed from the current product flow.",
);

const pastListings = read("lib/listing-doctor/pastListings.ts");
const marketTemplateCount = (pastListings.match(/make: "/g) ?? []).length;
check("synthetic market has 20 templates", marketTemplateCount === 20, `found ${marketTemplateCount}`);
check("synthetic market uses 500 records per template", pastListings.includes("Array.from({ length: 500 }"));
check("mock count is exported", pastListings.includes("export const MOCK_PAST_LISTING_COUNT"));
check("synthetic market includes seasonality", pastListings.includes("seasonalityIndex"));
check("synthetic market includes seller response behavior", pastListings.includes("sellerResponseTimeHours"));
check("synthetic market includes lead/contact signals", pastListings.includes("contactRate"));

const types = read("lib/listing-doctor/types.ts");
check("predictive mode is explicitly simulated", types.includes('mode: "simulated-ml"'));
check("past listing type tracks listing age", types.includes("listingAgeBucket"));
check("past listing type tracks seller response", types.includes("sellerResponseScore"));

const predictive = read("lib/listing-doctor/predictiveInsights.ts");
check("prediction references synthetic comparables", predictive.includes("synthetic comparable"));
check("prediction reports benchmark universe", predictive.includes("MOCK_PAST_LISTING_COUNT"));

const descriptionAssistant = read("lib/listing-doctor/descriptionAssistant.ts");
check("description assistant uses comparable context", descriptionAssistant.includes("successful"));
check("description assistant avoids urgency language", /must sell quickly|urgent/i.test(descriptionAssistant));

const docs = [
  read("README.md"),
  read("docs/hackathon-internal-reference.md"),
  read("docs/ai-harness/README.md"),
  read("docs/ai-harness/agent-briefs.md"),
].join("\n");

check("docs state no live URL fetch", /No live URL fetch|live URL fetch\/scraping is not implemented|live URL fetch, scraping/.test(docs));
check("docs identify synthetic data", /synthetic/i.test(docs));
check("docs identify simulated prediction", /simulated/i.test(docs));
check("docs warn not real ML", /not (a )?(trained )?ML|not real ML/i.test(docs));
check("docs mention 10,000 synthetic listings", /10,000|10000/.test(docs));
check("docs include AI harness", includes("README.md", "AI Harness") || includes("docs/hackathon-internal-reference.md", "AI harness"));
check("overnight plan requires hourly report", includes("docs/ai-harness/overnight-plan.md", "hourly report"));

const combinedSource = requiredFiles
  .filter((path) => fileExists(path) && !path.startsWith("docs/ai-harness"))
  .map((path) => read(path))
  .join("\n");

check(
  "old misleading equipment phrase is absent",
  !combinedSource.includes("defend the price"),
);
check(
  "source does not claim real historical data",
  !/real (AutoScout24 )?(historical|marketplace) data/i.test(combinedSource),
);

const failed = results.filter((result) => !result.passed);
const passed = results.length - failed.length;

for (const result of results) {
  const marker = result.passed ? "PASS" : "FAIL";
  const detail = result.detail ? ` - ${result.detail}` : "";
  console.log(`${marker} ${result.name}${detail}`);
}

console.log(`\nAI harness audit: ${passed}/${results.length} checks passed.`);

if (failed.length) {
  process.exitCode = 1;
}
