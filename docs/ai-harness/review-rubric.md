# Listing Coach Review Rubric

Use this rubric before accepting overnight agent work. Score each area from 0 to 3.

## 1. Product Truthfulness

- 0: Claims real data, real ML, real integration, or real image analysis that does not exist.
- 1: Mostly truthful, but some wording could mislead judges.
- 2: Clear about mocked/simulated behavior.
- 3: Explicit, concise, and consistent across UI, README, and internal docs.

## 2. Seller Usefulness

- 0: Advice is generic or unrelated to the current listing.
- 1: Advice is relevant but too broad.
- 2: Advice is specific to the listing and current section.
- 3: Advice is prioritized, actionable, and easy to explain in a demo.

## 3. Score Transparency

- 0: Scores appear arbitrary.
- 1: Scores have labels but weak explanations.
- 2: Scores explain major drivers and penalties.
- 3: Scores make it clear what changed, why it matters, and what improves next.

## 4. Data Realism

- 0: Synthetic data looks obviously fake or inconsistent.
- 1: Data is plausible but shallow.
- 2: Data includes realistic segments, age/mileage/price variation, and seller behavior.
- 3: Data supports believable pricing, prediction, and description examples while remaining deterministic.

## 5. UI Quality

- 0: Layout blocks the insertion task.
- 1: UI works but feels cluttered.
- 2: UI is clear and follows the seller through the form.
- 3: UI is calm, section-aware, and feels like embedded marketplace tooling.

## 6. Demo Reliability

- 0: Requires external services or manual recovery.
- 1: Works locally but has obvious fragile paths.
- 2: Works locally with tests and clear demo instructions.
- 3: Works locally, validates cleanly, and has a documented fallback story for mocked/simulated pieces.

## 7. Code Maintainability

- 0: Logic is duplicated or hidden in UI.
- 1: Logic works but crosses boundaries.
- 2: Logic lives in the appropriate domain modules with focused tests.
- 3: Boundaries are clear, tests cover behavior, and docs tell contributors where to extend.

## Acceptance Bar

For hackathon demo readiness, every changed area should score at least 2. Any 0 in product truthfulness, demo reliability, or code maintainability must block the change.
