#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const repoRoot = process.cwd();
const reportsDir = join(repoRoot, "docs/ai-harness/hourly-reports");
const args = parseArgs(process.argv.slice(2));
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-");
const filename = uniqueFile(join(reportsDir, `${stamp}.md`));

mkdirSync(reportsDir, { recursive: true });

const statusLines = runGit(["status", "--short"], 80);
const diffStat = runGit(["diff", "--stat"], 80);

const agent = args.agent ?? "Needs agent name";
const goal = args.goal ?? "Needs hourly goal";
const changed = args.changed ?? "Needs summary of files or behavior changed";
const improvement = args.improvement ?? "Needs explanation of how this improved Listing Coach";
const validation = args.validation ?? "Needs validation commands and results";
const risks = args.risks ?? "Needs risks, gaps, or follow-up notes";
const next = args.next ?? "Needs recommended next-hour focus";

const report = `# Hourly Agent Report

Generated: ${now.toISOString()}

## Agent

${agent}

## Goal

${goal}

## What Changed

${changed}

## How Listing Coach Improved

${improvement}

## Validation

${validation}

## Risks Or Gaps

${risks}

## Recommended Next Hour

${next}

## Repo Status Snapshot

\`\`\`text
${statusLines || "No git status output."}
\`\`\`

## Diff Stat Snapshot

\`\`\`text
${diffStat || "No tracked-file diff stat output."}
\`\`\`
`;

writeFileSync(filename, report, "utf8");

console.log(`Created ${relative(repoRoot, filename)}`);

function parseArgs(input) {
  const parsed = {};

  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (!token?.startsWith("--")) continue;

    const key = token.slice(2);
    const nextToken = input[index + 1];

    if (!nextToken || nextToken.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = nextToken;
    index += 1;
  }

  return parsed;
}

function runGit(args, maxLines) {
  try {
    const output = execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const lines = output.split("\n").filter(Boolean);
    const clipped = lines.slice(0, maxLines).join("\n");
    return lines.length > maxLines
      ? `${clipped}\n... clipped ${lines.length - maxLines} more lines`
      : clipped;
  } catch (error) {
    return `Unable to run git ${args.join(" ")}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function uniqueFile(basePath) {
  if (!existsSync(basePath)) return basePath;

  for (let index = 2; index < 100; index += 1) {
    const candidate = basePath.replace(/\.md$/, `-${index}.md`);
    if (!existsSync(candidate)) return candidate;
  }

  throw new Error("Could not create a unique hourly report filename.");
}
