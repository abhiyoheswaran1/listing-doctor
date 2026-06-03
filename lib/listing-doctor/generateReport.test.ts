import { describe, expect, test } from "vitest";

import { generateListingDescription } from "./descriptionAssistant";
import { demoListings } from "./demoListings";
import { generateReport } from "./generateReport";

describe("generateReport", () => {
  test("uses the factual description assistant for report rewrites", () => {
    const listing = {
      ...demoListings.find((item) => item.id === "demo-bmw-320d-weak")!,
      description: "",
    };

    const report = generateReport(listing);

    expect(report.rewrittenDescription).toBe(generateListingDescription(listing, "scratch").description);
    expect(report.rewrittenDescription).not.toContain("winter wheels may be available");
    expect(report.rewrittenDescription).not.toContain("Additional seller information");
  });

  test("does not place missing-data instructions inside rewritten buyer-facing copy", () => {
    const listing = {
      ...demoListings.find((item) => item.id === "demo-vw-golf-risky")!,
      description: "",
      keyFeatures: [],
      standardEquipment: [],
      optionalEquipment: [],
      sellerNotes: "",
    };

    const report = generateReport(listing);

    expect(report.rewrittenDescription).not.toContain("add the most important equipment before publishing");
    expect(report.rewrittenDescription).not.toContain("Clarify any missing documentation before publishing");
  });
});
