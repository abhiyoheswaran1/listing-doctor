# Listing Doctor Hackathon Internal Reference

Last reviewed from codebase: 2026-06-02

This document reflects the current repository implementation. Update it whenever code changes affect features, architecture, demo flow, limitations, APIs, or roadmap.

## 1. Project Overview

Listing Doctor is a local Next.js hackathon MVP for a seller-side vehicle listing quality assistant. It diagnoses a draft listing before publication and returns listing quality scoring, trust gaps, photo guidance, pricing feedback, likely buyer objections, a rewritten description, and a pre-publish checklist.

The product appears to be for marketplace sellers, dealer operations teams, seller success teams, support teams, and hackathon judges evaluating listing-quality coaching inside a vehicle marketplace.

Main product promise: **Your listing's conversion coach.**

Implemented flow:

- Seller identifies a vehicle with catalogue-backed make, model, production month/year, and version selection.
- Seller enters listing details, equipment, technical data, EV battery data, image coverage, and description.
- In the description section, the seller can generate a fresh buyer-facing description or improve their own text using deterministic local rules and synthetic successful comparable listings.
- If generated description copy becomes stale after important fields change, the UI warns the seller and offers refresh, review, or continue-anyway actions.
- After version selection unlocks the listing-data page, the browser calls `POST /api/diagnose-listing` as the seller edits.
- The API calls the shared diagnosis engine.
- The UI renders compact live coaching by default: overall health, current section focus, and one action for the field group the seller is editing. The full report stays behind a `Review report` reveal.

The app is not a buyer-side comparison assistant, not a car recommendation product, and not a listing creation product from documents or photos. Live URL fetch/scraping is not implemented.

## 2. Implemented Features

- Single App Router page at `app/page.tsx`.
- AutoScout24-style app shell in `components/listing-doctor/listing-doctor-app.tsx`.
- Three-step local insertion flow:
  - Page 1: identify make, model, production month, and production year from local catalogue data.
  - Page 2: pick the exact version filtered by selected production date.
  - Page 3: edit listing details with live Doctor support.
- Manual API dogfooding:
  - The UI calls `POST /api/diagnose-listing` only after the seller reaches listing-data entry with a selected version and core vehicle data.
  - The compact `Diagnose` backup action also calls `POST /api/diagnose-listing`.
  - The returned `ListingReport` drives the compact live Doctor panel and the optional full diagnosis report.
- Structured diagnosis API at `app/api/diagnose-listing/route.ts`.
- Shared diagnosis engine in `lib/listing-doctor/analyze.ts`.
- Shared report generation in `lib/listing-doctor/generateReport.ts`.
- Shared report UI in `components/listing-doctor/diagnosis-panel.tsx`.
- Sticky section-aware live Doctor panel in `components/listing-doctor/live-doctor-panel.tsx`. It focuses only on the active form section, is bounded to the visible browser height, and hides lower-priority details on shorter screens instead of creating a second scroll area.
- Inline description assistant in `components/listing-doctor/listing-details-page.tsx` with `Help me write` and `Make mine better` actions.
- Generated-description staleness tracking in `lib/listing-doctor/descriptionStaleness.ts`, surfaced in the details page, Doctor rail, and footer action area.
- Simulated ML-style prediction layer in `lib/listing-doctor/predictiveInsights.ts`, surfaced in the compact Doctor rail and full report.
- Four fictional Swiss demo listings in `lib/listing-doctor/demoListings.ts`.
- Deterministic mock listing generation in `lib/listing-doctor/mockData.ts`.
- Local catalogue data in `lib/listing-doctor/catalogue.ts`.
- 10,000 lightweight synthetic past listings in `lib/listing-doctor/pastListings.ts`, across 20 vehicle templates and including production/registration dates, region, equipment, seasonality, listing-age buckets, seller response behavior, dealer certification, photo quality proxies, description quality, views, leads, contact rate, price reductions, and success flags.
- Deterministic concise description drafting and rewriting in `lib/listing-doctor/descriptionAssistant.ts`.
- Local image upload simulation and image-tag/checklist sync in `lib/listing-doctor/imageUploads.ts`.
- Local AI harness documentation in `docs/ai-harness/*` for scoped overnight agent work and review guardrails.
- Project-specific audit command `npm run ai:audit`, implemented by `scripts/ai-harness/audit-listing-doctor.mjs`.
- Hourly agent report command `npm run ai:hourly-report`, implemented by `scripts/ai-harness/create-hourly-report.mjs`.
- Unit tests for analysis, pricing, catalogue, flow, image upload, mock data, API routes, and demo listings.

Not implemented:

- Authentication.
- Database or persistence.
- External AI calls.
- Real ML models.
- Official AutoScout24 integration.
- Live URL fetch or scraping.
- Real image analysis.
- Real market price service.
- Route-based multi-page wizard. The three-step flow is local React state inside `/`.

## 3. Architecture

Framework and stack:

- Next.js App Router.
- React 19.
- TypeScript.
- TailwindCSS.
- Lucide React icons.
- Minimal local UI primitives, not a full shadcn/ui install.
- Vitest.
- ESLint.

Main routes:

- `app/page.tsx`: renders `ListingDoctorApp`.
- `app/api/diagnose-listing/route.ts`: structured listing diagnosis.

Main components:

- `components/listing-doctor/listing-doctor-app.tsx`: app shell, draft state, API-backed diagnosis state, page layout.
- `components/listing-doctor/listing-editor.tsx`: routes the insertion flow to identify/version/details pages.
- `components/listing-doctor/identify-page.tsx`: catalogue make/model/production date selection and demo controls.
- `components/listing-doctor/version-page.tsx`: version cards filtered by production date.
- `components/listing-doctor/listing-details-page.tsx`: condition, price, equipment, technical data, EV battery data, image, and description editor.
- `components/listing-doctor/live-doctor-panel.tsx`: sticky compact real-time coaching panel with current-section focus, next action, and evidence chips.
- `components/listing-doctor/diagnosis-panel.tsx`: reusable report renderer, including the simulated prediction section.
- `components/listing-doctor/insertion-section.tsx`: collapsible insertion section wrapper.
- `components/listing-doctor/form-controls.tsx`: field/input/select/textarea wrappers.
- `components/ui/button.tsx`, `badge.tsx`, `progress.tsx`: local UI primitives.

Domain logic:

- `lib/listing-doctor/types.ts`: listing, report, and API response types.
- `lib/listing-doctor/apiPayload.ts`: lightweight structured listing API payload validation.
- `lib/listing-doctor/diagnosisReadiness.ts`: local readiness rule that prevents early Page 1/Page 2 API validation errors before a selected version and drivetrain/body data exist.
- `lib/listing-doctor/analyze.ts`: core rule-based diagnosis/scoring.
- `lib/listing-doctor/generateReport.ts`: improved title, rewritten description, and checklist generation.
- `lib/listing-doctor/flow.ts`: insertion flow unlock/step state.
- `lib/listing-doctor/catalogue.ts`: local make/model/production/version catalogue.
- `lib/listing-doctor/pricing.ts`: mocked original-new-price and benchmark calculations.
- `lib/listing-doctor/descriptionAssistant.ts`: deterministic buyer-facing SEO description drafting and seller-text improvement using local comparable context.
- `lib/listing-doctor/descriptionStaleness.ts`: snapshot helper for detecting when generated description copy may no longer match changed listing fields.
- `lib/listing-doctor/predictiveInsights.ts`: simulated ML-style prediction layer based on synthetic comparables and explainable scores.
- `lib/listing-doctor/imageUploads.ts`: local image upload/tagging helpers.
- `lib/listing-doctor/demoListings.ts`: curated demo listings.
- `lib/listing-doctor/mockData.ts`: deterministic generated mock listings.
- `lib/listing-doctor/pastListings.ts`: synthetic comparable listing dataset.
- `lib/listing-doctor/equipmentCatalog.ts`: equipment option lists.
- `scripts/ai-harness/audit-listing-doctor.mjs`: local audit for product invariants that lint/build do not cover.
- `scripts/ai-harness/create-hourly-report.mjs`: creates timestamped markdown reports under `docs/ai-harness/hourly-reports/`.

Demo/mock data:

- `demoListings.ts`: weak BMW, strong Toyota RAV4 Hybrid, risky VW Golf, premium Tesla Model Y.
- `mockData.ts`: deterministic generator for additional local listing drafts.
- `pastListings.ts`: 20 market templates with 500 synthetic listings each, for 10,000 total mock historical records.

## 4. Core Logic Explanation

The single diagnosis source of truth is `analyzeListing(listing)` in `lib/listing-doctor/analyze.ts`. `generateReport(listing)` in `lib/listing-doctor/generateReport.ts` wraps that analysis and adds generated report copy: improved title, rewritten description, and final checklist.

Main score fields:

- Overall listing health.
- Trust.
- Description quality.
- Photo completeness.
- Searchability.
- Vehicle data.
- Equipment.
- Technical data.
- Market position.
- Battery data for EV listings.

Core weighted score:

- Trust: 28%.
- Description quality: 20%.
- Photo completeness: 20%.
- Searchability: 14%.
- Price score: 18%.

The final overall score blends the weighted rule score with the point-based insertion breakdown:

- 72% weighted rule score.
- 28% point-based breakdown score.

Publish readiness:

- `Ready to publish`: overall at least 80, trust at least 80, photo completeness at least 80, and description quality at least 75.
- `High risk, fix first`: overall below 50, trust below 45, or MFK is not valid while accident history is unknown.
- Otherwise: `Improve before publishing`.

Trust rules consider missing or unknown MFK, expired MFK, service history gaps, unknown accident history, repaired/current damage, missing warranty, urgency language, high-mileage diesel concerns, and EV battery proof gaps.

Description rules consider word count, vague phrases, urgency language, and lack of trust-building wording around MFK, service, accident status, warranty, invoices, documentation, and maintenance. Minor copy feedback can lower the description score slightly, but it only becomes a top rewrite fix when the issue is material, such as very short copy, vague claims, missing proof wording, or low description score.

Photo scoring uses weighted checklist coverage plus photo count. Checklist items include front/rear/side exterior, interior, dashboard, odometer, tyres, service book, and defects/damage. `defectsDamage` is only required when accident history is `repaired` or `has-damage`; it is not required for an accident-free listing.

Price feedback uses `lib/listing-doctor/pricing.ts` and local synthetic comparables from `pastListings.ts`. The benchmark estimates original new price, vehicle age, expected mileage, mileage factor, age retention, and close comparable median. It is mocked and not a real market price service.

Equipment scoring is intentionally not "more options is always better." `scoreEquipment()` in `lib/listing-doctor/analyze.ts` gives most points for confirming catalogue standard equipment. Optional equipment is neutral when none is selected and only adds value when the seller selects equipment the car actually has. This matches the insertion model: the platform can provide standard equipment from catalogue/version context, while sellers should only confirm real optional equipment.

Description assistance uses `generateListingDescription(listing, mode)` in `lib/listing-doctor/descriptionAssistant.ts`. `scratch` mode writes a fresh buyer-facing description from structured listing fields. `polish` mode rewrites meaningful seller text after removing urgency wording such as "must sell quickly"; it also detects assistant-generated drafts so clicking the rewrite action after a generated draft does not duplicate the opening paragraph. The helper uses successful synthetic comparable listings from `pastListings.ts` for style context and shows product-facing source wording with average leads and days online for matched comparable listings. Missing MFK, service, accident, or warranty proof is returned as UI guidance, not inserted into the published description text.

Generated-description staleness uses `createDescriptionSnapshot(listing, mode, description)` and `getDescriptionStaleness(listing, snapshot)` in `lib/listing-doctor/descriptionStaleness.ts`. When the seller generates copy, the app snapshots source fields that may be mentioned in the description: MFK, service history, accident history, warranty, mileage, price, features/equipment, seller notes, and EV battery data. If those fields change while the generated text remains untouched, the details page, Doctor rail, and footer show a stale-copy warning. The app does not auto-change the textarea; the seller can refresh, review, or continue anyway.

Simulated prediction uses `buildPredictiveInsights(listing, input)` in `lib/listing-doctor/predictiveInsights.ts`. It combines existing explainable scores, top fixes, buyer questions, pricing position, photo gaps, and synthetic comparables from `pastListings.ts`. The output includes `mode: "simulated-ml"`, confidence, expected enquiry-lift range, lead probability score, expected first-contact timing, expected days online, likely buyer objections, and performance signals. This is deterministic demo logic and not a trained ML model.

Synthetic past listings now include richer marketplace-style fields: production month/year, first registration month/year, region, listing month, seasonality index, listing age days, listing age bucket, seller response time, seller response score, dealer certification, dealer warranty flag, standard equipment, optional equipment, photo coverage score, image quality score, description quality score, view count, lead count, contact rate, favourite count, price reduction count, sold flag, quality score, and successful flag. These fields are generated deterministically for demo reliability.

## 5. API Documentation

### `POST /api/diagnose-listing`

Purpose: diagnose a structured listing payload using the shared report generator.

Validation requires the core structured listing shape, including make, model, version-derived drivetrain/body fields, numeric price/mileage/photo count, enums, `photoChecklist`, and `keyFeatures`. `description` must be present as a string but can be empty so the Doctor can score missing listing copy instead of rejecting an in-progress draft.

Request:

```json
{
  "listing": {
    "...": "ListingDraft fields"
  }
}
```

Success response:

```json
{
  "source": "structured",
  "listing": {},
  "diagnosis": {}
}
```

Invalid payload response:

```json
{
  "error": "Invalid listing payload",
  "details": ["listing is required"]
}
```

Example:

```bash
curl -X POST http://127.0.0.1:3020/api/diagnose-listing \
  -H "Content-Type: application/json" \
  -d '{
    "listing": {
      "id": "api-demo-bmw",
      "name": "API demo BMW",
      "make": "BMW",
      "model": "320d Touring",
      "version": "xDrive Steptronic",
      "year": 2019,
      "productionMonth": "April",
      "productionYear": 2019,
      "firstRegistrationMonth": "April",
      "firstRegistrationYear": 2019,
      "priceChf": 24900,
      "mileageKm": 112000,
      "fuelType": "Diesel",
      "transmission": "Automatic",
      "bodyType": "Estate",
      "sellerType": "dealer",
      "mfkStatus": "valid",
      "serviceHistoryStatus": "missing",
      "accidentHistoryStatus": "unknown",
      "warrantyStatus": "none",
      "description": "Very good condition, must sell quickly.",
      "photoCount": 4,
      "photoChecklist": {
        "frontExterior": true,
        "rearExterior": true,
        "leftSide": false,
        "rightSide": false,
        "interior": false,
        "dashboard": false,
        "odometer": false,
        "tyres": false,
        "serviceBook": false,
        "defectsDamage": false
      },
      "keyFeatures": ["Automatic", "Estate"],
      "sellerNotes": ""
    }
  }'
```

## 6. Demo Guide

Run locally:

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3020
```

Demo steps:

1. Load the weak BMW demo or generate a mock draft.
2. Show Page 1 catalogue production date selection.
3. Continue to version selection and show version filtering.
4. Continue to listing data.
5. Click the compact `Diagnose` backup action, or edit fields and let live diagnosis refresh.
6. In the description section, click `Help me write` to generate copy from the structured listing or `Make mine better` to improve existing seller text.
7. Change MFK, service history, warranty, price, equipment, seller notes, or EV battery data after generating text to show stale-description protection.
8. Edit MFK, service history, warranty, price, image coverage, or description.
9. Highlight that the report comes from `POST /api/diagnose-listing`.
10. Show the compact assistant first: score, current form section, and one action. Use `Review report` only for the deeper score breakdown, simulated prediction, buyer questions, rewritten description, and checklist.

Suggested judging highlight:

- The insertion flow is catalogue-backed.
- The Doctor follows the seller through the real listing data flow and stays within the visible page height.
- The scoring is transparent and deterministic.
- The simulated prediction layer demonstrates how future ML could estimate enquiry lift and likely objections while preserving explainable rules.
- Generated descriptions stay under seller control; field changes trigger review warnings instead of silently overwriting text.
- The pricing benchmark has 10,000 local synthetic historical records, not real market data.
- Equipment scoring rewards catalogue confirmation and optional-equipment accuracy; it does not reward selecting extras the vehicle does not have.
- The catalogue constrains make/model/version choices by production month and year.
- The AI harness is repo-local: it gives future agents scoped briefs and validation gates, but it is not an external AI service or autonomous production system.
- Hourly reports can be generated locally with `npm run ai:hourly-report`; they are markdown files and are not automatically sent as chat messages.

## 7. Judging Pitch Notes

Problem solved: sellers often publish listings with missing proof, weak descriptions, incomplete photo coverage, unclear price positioning, and avoidable buyer objections. The app shows how a marketplace could coach sellers before publication.

Why it matters: better listings reduce buyer uncertainty and should improve lead conversion, seller trust, support efficiency, and marketplace listing quality.

What the demo proves:

- Listing quality can be scored consistently from structured listing data.
- Seller guidance can be embedded inside an insertion flow instead of shown only after submission.
- Rule-based MVP logic can still feel intelligent if the output is specific, prioritised, and transparent.
- ML-ready product concepts can be demoed honestly with simulated comparable-based predictions while the MVP remains deterministic.

Potential business/product impact:

- Higher-quality published inventory.
- Fewer buyer follow-up questions for missing basics.
- More transparent seller coaching.
- Future support and seller-success workflows based on listing quality score.

## 8. Limitations

- Rule-based MVP only.
- No authentication.
- No persistence.
- No database.
- No external AI, OCR, or LLM call.
- Description assistance is deterministic and uses local synthetic comparables, not real seller history or real successful user listing data.
- Simulated prediction is deterministic and uses synthetic comparable listings, not a trained ML model.
- No official AutoScout24 integration.
- No live URL fetch or scraping.
- No real image quality or damage analysis.
- No real market price benchmarking.
- Mock market feedback uses local synthetic listings.
- API validation is lightweight and hand-written.
- No rate limiting, monitoring, analytics, or production observability.
- No E2E browser tests are currently committed.
- The AI harness is documentation plus a local audit script. It does not run autonomous agents by itself.
- Hourly reporting is local file generation only. It does not push notifications or message the user automatically.

## 9. Future Roadmap

Near-term:

- Improve API validation and error detail.
- Make score explanations more granular.
- Improve description assistant templates and warning display.
- Continue refining the compact Doctor rail with browser screenshots across short and tall viewports.
- Improve simulated prediction calibration and confidence messaging.
- Add more catalogue records.
- Add more pricing benchmark tests and edge cases.
- Add E2E tests for the insertion and diagnosis flow.

Long-term:

- Integrate official internal listing draft APIs.
- Integrate into seller insertion flow.
- Integrate into seller cockpit.
- Add batch listing quality audits.
- Add image quality and damage analysis.
- Replace simulated prediction with trained lead probability, time-to-contact, and conversion-lift models.
- Add registration document and service book extraction.
- Add real market price benchmarking.
- A/B test listing quality recommendations against lead conversion.
- Add authentication, rate limiting, monitoring, and audit logs.
- Add support and seller-success tooling based on listing quality score.

## 10. Technical Notes For Contributors

- Add or modify scoring rules in `lib/listing-doctor/analyze.ts`.
- Modify generated titles, descriptions, and checklists in `lib/listing-doctor/generateReport.ts`.
- Modify the inline description writing helper in `lib/listing-doctor/descriptionAssistant.ts`.
- Modify generated-description stale-copy detection in `lib/listing-doctor/descriptionStaleness.ts`.
- Modify simulated prediction logic in `lib/listing-doctor/predictiveInsights.ts`.
- Add curated demo listings in `lib/listing-doctor/demoListings.ts`.
- Add deterministic generated mock data in `lib/listing-doctor/mockData.ts`.
- Add catalogue makes/models/versions in `lib/listing-doctor/catalogue.ts`.
- Modify API payload rules in `lib/listing-doctor/apiPayload.ts`.
- Modify UI/API diagnosis readiness in `lib/listing-doctor/diagnosisReadiness.ts`.
- Modify structured diagnosis API behavior in `app/api/diagnose-listing/route.ts`.
- Modify UI flow in `components/listing-doctor/listing-doctor-app.tsx` and page components.
- Modify report rendering in `components/listing-doctor/diagnosis-panel.tsx`.
- Use `docs/ai-harness/agent-briefs.md` when assigning overnight improvement work to coding agents.
- Run `npm run ai:audit` after product, docs, scoring, mock data, or UI changes to catch project-specific drift.
- Run `npm run ai:hourly-report` at the end of each overnight work block to record what changed and how the product improved.

Known cleanup opportunities:

- Add typed schema validation if the prototype moves beyond hackathon scope.
- Add Playwright E2E coverage for the insertion flow.
- Consider moving manual API refresh/debounce into a small hook.
