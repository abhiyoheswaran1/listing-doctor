# Listing Doctor

Listing Doctor is a hackathon MVP for a seller-side vehicle listing quality assistant. It reviews a draft vehicle listing before publication and returns listing quality scoring, trust gaps, photo guidance, pricing feedback, buyer objections, a rewritten description, and a pre-publish checklist.

Tagline: **Your listing's conversion coach.**

## What It Does

- Reviews a manual vehicle draft inside an AutoScout24-style insertion flow.
- Uses catalogue-backed make, model, production month/year, and version selection.
- Calls the shared rule-based diagnosis engine through `POST /api/diagnose-listing`.
- Renders a compact Listing Doctor assistant beside the insertion flow with the live score, current section focus, and one current section action.
- Keeps the Listing Doctor assistant inside the visible browser height; lower-priority details collapse on shorter screens instead of forcing a second scroll.
- Adds description-assistant actions that can write concise buyer-facing SEO copy from listing data or improve the seller's own text using local successful synthetic comparables.
- Warns when generated description copy may be stale after important source fields change, with explicit refresh/review/continue actions.
- Adds a simulated ML-style prediction layer based on local synthetic comparables: confidence, expected enquiry lift, likely buyer objections, first-contact timing, and performance signals.
- Scores equipment by catalogue confirmation and accuracy, not by pushing sellers to select optional extras their car does not have.
- Keeps the full diagnosis report available behind an explicit **Review report** action.

The MVP has no authentication, database, external AI call, live URL fetch, scraping, or real AutoScout24 integration.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3020
```

Validation:

```bash
npm test
npm run lint
npm run ai:audit
npm run build
```

## AI Harness

The repo includes a local AI harness for safe overnight improvement work:

- `docs/ai-harness/agent-briefs.md`: scoped agent roles for product, scoring, mock market data, description assistance, UI, QA, and docs.
- `docs/ai-harness/overnight-plan.md`: a validation-gated improvement loop for multiple agent sessions.
- `docs/ai-harness/review-rubric.md`: review criteria for product truthfulness, seller usefulness, score transparency, data realism, UI quality, demo reliability, and maintainability.
- `npm run ai:audit`: project-specific checks that guard against misleading claims, URL diagnosis drift, and synthetic-data misrepresentation.
- `npm run ai:hourly-report`: creates a timestamped local report of what an agent changed, how the product improved, validation, risks, and next focus.

This harness does not run external AI, does not run a background daemon, and does not make the product a real ML system.

## Demo Flow

1. Open the app.
2. Load a demo listing, generate mock data, or edit the fields manually.
3. Page 1: identify make, model, production year, and production month from the local catalogue.
4. Page 2: pick the exact version filtered by that production date.
5. Page 3: edit condition, price, equipment, technical data, EV battery data, images, and description.
6. In the description section, use **Help me write** for a fresh draft or **Make mine better** to improve seller-written text.
7. Change a trust field such as MFK after generating text to show the stale-description warning.
8. Click the compact **Diagnose** backup action or edit fields and watch the API-backed report refresh.
9. Highlight the Doctor rail: live score, current section focus, and one action for the field group the seller is editing.
10. Use **Review report** only when you want to show the deeper score breakdown, simulated predictive insight, trust gaps, photo checklist, pricing feedback, buyer questions, rewritten description, and final checklist.

## API Endpoint

### `POST /api/diagnose-listing`

Diagnoses a structured listing payload using the shared report generator.

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

## Architecture

- `app/page.tsx`: app entry point.
- `app/api/diagnose-listing/route.ts`: structured listing diagnosis API.
- `components/listing-doctor/*`: insertion editor, live Doctor rail, and reusable diagnosis report.
- `components/ui/*`: lightweight button, badge, and progress primitives.
- `lib/listing-doctor/types.ts`: shared listing, report, and API response types.
- `lib/listing-doctor/analyze.ts`: single source of truth for rule-based scoring.
- `lib/listing-doctor/generateReport.ts`: diagnosis report generation.
- `lib/listing-doctor/descriptionAssistant.ts`: deterministic concise SEO description drafting and rewrite helper.
- `lib/listing-doctor/descriptionStaleness.ts`: generated-description source-field snapshot and stale-copy detection.
- `lib/listing-doctor/predictiveInsights.ts`: simulated ML-style prediction layer from synthetic comparables and explainable scores.
- `lib/listing-doctor/demoListings.ts`: four curated fictional Swiss demo listings.
- `lib/listing-doctor/mockData.ts`: deterministic mock listing generator.
- `lib/listing-doctor/catalogue.ts`: local make/model/production/version catalogue.
- `lib/listing-doctor/pastListings.ts`: 10,000 lightweight synthetic past listings across 20 vehicle templates, with benchmark, equipment, photo, description, seasonality, listing-age, seller-behavior, view, lead, contact-rate, and price-reduction signals.

## Limitations

- Pricing benchmarks use local synthetic data, not real market pricing.
- Image upload is local state metadata only. There is no real image analysis or persistence.
- All diagnosis, rewrite, recommendations, buyer questions, and scoring are deterministic TypeScript rules.
- Equipment scoring assumes seller honesty. It rewards confirming known standard equipment and selecting only real optional equipment; it does not verify physical equipment.
- Description assistance uses the current draft and local synthetic successful comparables. It does not use real seller history, real buyer behavior data, or an external AI model.
- The predictive layer is simulated from synthetic comparable listings and explainable scores. It is not a trained model and should not be presented as real ML.
- No authentication, rate limiting, monitoring, persistence, live URL fetch, scraping, or production AutoScout24 system integration is implemented.

## Future Roadmap

- Add stronger API validation and typed schemas.
- Improve score explanations and confidence messaging.
- Replace simulated prediction with trained lead/time-to-contact models once real marketplace data is available.
- Integrate with official internal listing draft APIs.
- Integrate into seller insertion flow and seller cockpit.
- Add image quality, damage, and document analysis.
- Replace mocked pricing with real market benchmarks.
- Add batch listing quality audits.
- Measure recommendation acceptance and lead-conversion impact.
