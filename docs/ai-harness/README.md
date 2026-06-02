# Listing Coach AI Harness

This folder is the repo-native harness for letting future coding agents improve Listing Coach without drifting away from the implemented product.

The harness is intentionally local and deterministic. It does not call external AI APIs, does not run a background daemon, and does not claim that the prototype has real ML or real AutoScout24 marketplace data. It gives agents clear roles, guardrails, review criteria, and a local audit command.

## What The Harness Protects

- Listing Coach remains a seller-side insertion assistant, not a buyer comparison tool.
- The implemented product remains manual draft diagnosis through `POST /api/diagnose-listing`.
- The live URL diagnosis tab is not reintroduced unless explicitly requested and documented.
- Synthetic comparable listings are described as synthetic demo data.
- Simulated prediction is described as deterministic demo logic, not a trained ML model.
- Documentation stays aligned with code after meaningful feature changes.

## Local Commands

Run these before and after any overnight improvement loop:

```bash
npm test
npm run lint
npm run build
npm run ai:audit
```

`npm run ai:audit` checks project-specific invariants that generic lint/build cannot catch.

Create an hourly progress report with:

```bash
npm run ai:hourly-report -- --agent "UI/UX Insertion Flow Agent" --goal "Reduce Coach panel clutter" --improvement "Made current-section guidance shorter and easier to demo"
```

Reports are written to `docs/ai-harness/hourly-reports/`.

## Agent Operating Loop

1. Pick one brief from `agent-briefs.md`.
2. Read the files listed in that brief before editing.
3. Make one scoped improvement.
4. Update `docs/hackathon-internal-reference.md` if features, architecture, demo flow, limitations, APIs, or roadmap changed.
5. Run the validation commands above.
6. Create an hourly report with `npm run ai:hourly-report`.
7. Leave a short handoff note with changed files, validation results, and remaining gaps.

## Guardrails

- Do not add authentication, persistence, external APIs, or live scraping unless the user explicitly asks for that scope.
- Do not duplicate scoring logic in UI components or API routes.
- Do not claim real historical marketplace data, real ML, real image analysis, or production AutoScout24 integration.
- Do not reward sellers for selecting optional equipment they do not actually have.
- Do not auto-overwrite generated listing descriptions after the seller edits fields; warn and offer refresh instead.
