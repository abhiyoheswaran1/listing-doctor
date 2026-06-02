# Hourly Reports

Overnight agents should create one report per hour here.

Use:

```bash
npm run ai:hourly-report -- --agent "Scoring Engine Agent" --goal "Improve old/high-mileage rules" --improvement "Added clearer MFK and mileage penalties"
```

Each generated report should answer:

- What changed?
- How did the product improve?
- What validation passed?
- What remains risky or incomplete?
- What should the next agent do?

Reports are local markdown files. They are not automatically sent as chat messages.

