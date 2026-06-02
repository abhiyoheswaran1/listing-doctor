import { describe, expect, test } from "vitest";

import {
  generateListingDescription,
  getDescriptionComparableContext,
} from "./descriptionAssistant";
import { demoListings } from "./demoListings";

describe("description assistant", () => {
  test("drafts an SEO-oriented description from listing data and successful mock comparables", () => {
    const listing = demoListings.find((item) => item.id === "demo-toyota-rav4-strong") ?? demoListings[0];
    const result = generateListingDescription(listing, "scratch");

    expect(result.description).toContain("Toyota RAV4 Hybrid");
    expect(result.description).toContain("Switzerland");
    expect(result.description).toContain("68'000 km");
    expect(result.description).toContain("MFK valid");
    expect(result.description).not.toContain("buyers search");
    expect(result.description).not.toContain("Add the MFK date");
    expect(result.comparableCount).toBeGreaterThan(0);
    expect(result.sourceSummary).toContain("successful comparable listings");
  });

  test("does not put internal coaching language into a buyer-facing draft when trust fields are missing", () => {
    const listing = {
      ...demoListings.find((item) => item.id === "demo-bmw-320d-weak")!,
      description: "",
    };
    const result = generateListingDescription(listing, "scratch");

    expect(result.description).toContain("BMW 320d Touring xDrive Steptronic");
    expect(result.description).toContain("174'000 km");
    expect(result.description).not.toContain("MFK unknown");
    expect(result.description).not.toContain("Add the MFK date");
    expect(result.description).not.toContain("key information buyers search");
  });

  test("polishing an assistant-generated draft does not duplicate the generated opening", () => {
    const listing = {
      ...demoListings.find((item) => item.id === "demo-bmw-320d-weak")!,
      description: "",
    };
    const draft = generateListingDescription(listing, "scratch").description;
    const polished = generateListingDescription({ ...listing, description: draft }, "polish");

    expect(polished.description).not.toContain("The seller notes: 2016 BMW");
    expect(polished.description.match(/2016 BMW 320d Touring/g) ?? []).toHaveLength(1);
  });

  test("polishes existing seller text without keeping urgency wording", () => {
    const listing = {
      ...demoListings.find((item) => item.id === "demo-vw-golf-risky")!,
      description: "Good car. Must sell quickly. Call me.",
    };
    const result = generateListingDescription(listing, "polish");

    expect(result.description).toContain("Volkswagen Golf 1.4 TSI");
    expect(result.description.toLowerCase()).not.toContain("must sell quickly");
    expect(result.description).toContain("Seller highlights");
    expect(result.description).not.toContain("The seller notes");
  });

  test("keeps generated copy concise and marketplace-ready", () => {
    const listing = {
      ...demoListings.find((item) => item.id === "demo-bmw-320d-weak")!,
      description: "",
    };
    const result = generateListingDescription(listing, "scratch");
    const paragraphCount = result.description.split("\n\n").filter(Boolean).length;

    expect(paragraphCount).toBeLessThanOrEqual(4);
    expect(result.description).not.toContain("Main specification");
    expect(result.description).not.toContain("engine, automatic transmission");
    expect(result.sourceSummary).toMatch(/successful comparable listings/i);
    expect(result.sourceSummary).toMatch(/lead/i);
  });

  test("returns comparable style context for the current vehicle segment", () => {
    const context = getDescriptionComparableContext(demoListings[0]);

    expect(context.totalComparableCount).toBeGreaterThan(0);
    expect(context.successfulComparableCount).toBeGreaterThan(0);
    expect(context.styleNotes).toContain("Lead with exact model, version, mileage, fuel type, transmission, and body style.");
  });
});
