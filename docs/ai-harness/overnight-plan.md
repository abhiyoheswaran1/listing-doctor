# Overnight Improvement Plan

This plan is for running several focused coding-agent sessions through the night. It is not an autonomous background process. Each session should pick one brief, make a scoped improvement, validate it, and leave a handoff.

## Run Order

1. Baseline QA And Demo Agent
   - Run the full validation suite.
   - Record failures before making changes.

2. Mock Market Data Agent
   - Improve synthetic comparable quality only if tests stay deterministic.
   - Keep the dataset lightweight and local.

3. Scoring Engine Agent
   - Add one or two explainable rules that use existing data.
   - Add tests before changing scoring behavior.

4. Description Assistant Agent
   - Improve copy quality and stale-description protection.
   - Keep generated text buyer-facing, not internal.

5. UI/UX Insertion Flow Agent
   - Polish the highest-friction area found during demo QA.
   - Keep Listing Doctor as a following assistant, not a separate step.

6. Documentation Steward Agent
   - Reconcile README and internal reference with actual final code.

## Required Validation Gate

Run after every scoped improvement:

```bash
npm test
npm run lint
npm run build
npm run ai:audit
```

If a validation command fails, fix that failure before starting another improvement.

## Required Hourly Report

Every hour, the active agent must create an hourly report:

```bash
npm run ai:hourly-report -- \
  --agent "Scoring Engine Agent" \
  --goal "Improve high-mileage pricing and trust rules" \
  --changed "Added tests and adjusted mileage-price explanation copy" \
  --improvement "Sellers can now explain why an old high-mileage car loses trust or price points" \
  --validation "npm test, npm run lint, npm run ai:audit, npm run build passed" \
  --risks "Still synthetic; no real market pricing" \
  --next "Review Doctor panel wording for the new rule"
```

The report must say what changed, how Listing Doctor improved, what validation passed, remaining risks, and what the next agent should do.

## Stop conditions

- `npm run build` fails and the agent cannot isolate the cause.
- `npm run ai:audit` fails because the product direction is unclear.
- A proposed change requires real data, external APIs, auth, persistence, or live scraping.
- A change would misrepresent synthetic data as real marketplace data.
- A UI change makes the insertion flow harder to demo.

## Handoff Format

Use this short format after each session:

```text
Agent:
Goal:
Files changed:
Validation:
Product behavior changed:
Docs updated:
Known gaps:
Recommended next agent:
```

## High-Value Backlog For Overnight Work

- Add more tests around scoring edge cases for old/high-mileage vehicles.
- Improve buyer-objection wording by make/model/fuel type.
- Improve synthetic market data distributions for dealer/private behavior.
- Add a small quality-audit pass over the sticky Doctor panel.
- Improve the description assistant with cleaner title and paragraph structure.
- Add a lightweight browser smoke test if the repo standardizes on Playwright.
