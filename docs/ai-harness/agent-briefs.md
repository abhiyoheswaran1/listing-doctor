# Overnight Agent Briefs

Use one brief per agent/session. Keep changes narrow, validate them, and update internal docs when behavior changes.

## Product Strategy Agent

Mission: sharpen the product around seller coaching inside the insertion flow.

Read first:

- `README.md`
- `docs/hackathon-internal-reference.md`
- `components/listing-doctor/listing-doctor-app.tsx`
- `components/listing-doctor/live-doctor-panel.tsx`

Allowed:

- Improve demo flow copy, prioritization, and explanatory labels.
- Tighten how simulated prediction and score transparency are presented.
- Add grounded backlog items to docs.

Forbidden:

- Do not add buyer-side comparison or recommendation features.
- Do not describe planned ideas as implemented.
- Do not introduce a URL diagnosis tab without explicit user approval.

Validation:

- `npm run ai:audit`
- `npm run build`
- `npm run ai:hourly-report` at the end of the hour

## Scoring Engine Agent

Mission: improve rule quality while keeping scoring explainable.

Read first:

- `lib/listing-doctor/analyze.ts`
- `lib/listing-doctor/pricing.ts`
- `lib/listing-doctor/predictiveInsights.ts`
- `lib/listing-doctor/analyze.test.ts`
- `lib/listing-doctor/pricing.test.ts`

Allowed:

- Add or adjust deterministic scoring rules.
- Improve score explanations, thresholds, and buyer-objection generation.
- Add tests before rule changes.

Forbidden:

- Do not move scoring into React components.
- Do not make the score a black box.
- Do not call the simulated prediction layer real ML.

Validation:

- `npm test -- lib/listing-doctor/analyze.test.ts lib/listing-doctor/pricing.test.ts`
- `npm run ai:audit`
- `npm run ai:hourly-report` at the end of the hour

## Mock Market Data Agent

Mission: make synthetic comparable data more realistic and useful for pricing, prediction, and description assistance.

Read first:

- `lib/listing-doctor/pastListings.ts`
- `lib/listing-doctor/pastListings.test.ts`
- `lib/listing-doctor/types.ts`
- `lib/listing-doctor/predictiveInsights.ts`

Allowed:

- Add deterministic fields that improve synthetic realism.
- Expand templates if lightweight.
- Improve distributions for seasonality, dealer/private behavior, listing age, leads, and success flags.

Forbidden:

- Do not present synthetic data as real marketplace history.
- Do not fetch external data.
- Do not make test output random or time-dependent.

Validation:

- `npm test -- lib/listing-doctor/pastListings.test.ts`
- `npm run ai:audit`
- `npm run ai:hourly-report` at the end of the hour

## Description Assistant Agent

Mission: improve generated seller descriptions without losing seller control.

Read first:

- `lib/listing-doctor/descriptionAssistant.ts`
- `lib/listing-doctor/descriptionStaleness.ts`
- `lib/listing-doctor/descriptionAssistant.test.ts`
- `lib/listing-doctor/descriptionStaleness.test.ts`
- `components/listing-doctor/listing-details-page.tsx`

Allowed:

- Improve buyer-facing copy structure.
- Improve staleness checks and refresh messaging.
- Add tests for generated copy and stale-copy protection.

Forbidden:

- Do not insert internal coaching instructions into published descriptions.
- Do not duplicate generated descriptions when polishing.
- Do not auto-overwrite seller-edited text after field changes.

Validation:

- `npm test -- lib/listing-doctor/descriptionAssistant.test.ts lib/listing-doctor/descriptionStaleness.test.ts`
- `npm run build`
- `npm run ai:hourly-report` at the end of the hour

## UI/UX Insertion Flow Agent

Mission: make the insertion flow and sticky Coach panel calmer, clearer, and closer to AutoScout24-style form behavior.

Read first:

- `components/listing-doctor/listing-doctor-app.tsx`
- `components/listing-doctor/identify-page.tsx`
- `components/listing-doctor/version-page.tsx`
- `components/listing-doctor/listing-details-page.tsx`
- `components/listing-doctor/live-doctor-panel.tsx`
- `app/globals.css`

Allowed:

- Reduce clutter.
- Improve hierarchy, spacing, labels, and section-aware coaching.
- Make the Coach panel more useful at the current field/section.

Forbidden:

- Do not add a landing page.
- Do not make Listing Coach a separate wizard step.
- Do not hide required insertion fields behind the Coach.

Validation:

- `npm run lint`
- `npm run build`
- Browser check on `http://127.0.0.1:3020` when UI changes are significant.
- `npm run ai:hourly-report` at the end of the hour

## QA And Demo Agent

Mission: keep the hackathon demo reliable.

Read first:

- `README.md`
- `docs/hackathon-internal-reference.md`
- `lib/listing-doctor/apiRoutes.test.ts`
- `components/listing-doctor/listing-doctor-app.tsx`

Allowed:

- Add targeted tests for critical demo flows.
- Improve demo instructions and validation steps.
- Add small fixtures for known edge cases.

Forbidden:

- Do not add brittle tests that require network access.
- Do not require a database or external service.
- Do not mark unimplemented behavior as working.

Validation:

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run ai:audit`
- `npm run ai:hourly-report` at the end of the hour

## Documentation Steward Agent

Mission: keep docs aligned with actual code.

Read first:

- `README.md`
- `docs/hackathon-internal-reference.md`
- `docs/ai-harness/README.md`
- Recent changed files

Allowed:

- Correct docs after code changes.
- Add limitations when behavior is mocked, simulated, or missing.
- Add concise API/demo instructions.

Forbidden:

- Do not write marketing fluff.
- Do not document planned features as implemented.
- Do not omit validation results from handoff notes.

Validation:

- `npm run ai:audit`
- `npm run ai:hourly-report` at the end of the hour
