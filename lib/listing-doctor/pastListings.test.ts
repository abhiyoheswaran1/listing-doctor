import { describe, expect, it } from "vitest";

import {
  getComparablePastListings,
  mockPastListings,
  MOCK_PAST_LISTING_COUNT,
} from "./pastListings";
import { demoListings } from "./demoListings";

describe("mock past listings", () => {
  it("provides a richer synthetic historical dataset for benchmark-style demos", () => {
    expect(MOCK_PAST_LISTING_COUNT).toBe(10000);
    expect(mockPastListings).toHaveLength(MOCK_PAST_LISTING_COUNT);

    const sample = mockPastListings[0];

    expect(sample.productionMonth).toBeTruthy();
    expect(sample.productionYear).toBeGreaterThan(2010);
    expect(sample.firstRegistrationMonth).toBeTruthy();
    expect(sample.firstRegistrationYear).toBeGreaterThan(2010);
    expect(sample.region).toMatch(/ZH|BE|VD|BS|TI|GE|LU|SG/);
    expect(sample.standardEquipment.length).toBeGreaterThan(0);
    expect(sample.photoCoverageScore).toBeGreaterThanOrEqual(0);
    expect(sample.descriptionQualityScore).toBeGreaterThanOrEqual(0);
    expect(sample.viewCount).toBeGreaterThan(0);
    expect(sample.contactRate).toBeGreaterThan(0);
    expect(sample.listingMonth).toBeTruthy();
    expect(sample.seasonalityIndex).toBeGreaterThan(0);
    expect(sample.listingAgeDays).toBeGreaterThan(0);
    expect(["first-week", "active", "aging", "stale"]).toContain(sample.listingAgeBucket);
    expect(sample.sellerResponseTimeHours).toBeGreaterThan(0);
    expect(sample.sellerResponseScore).toBeGreaterThan(0);
  });

  it("returns a large comparable sample for exact demo vehicles", () => {
    const bmw = demoListings.find((item) => item.id === "demo-bmw-320d-weak")!;
    const comparables = getComparablePastListings(bmw);

    expect(comparables.length).toBeGreaterThanOrEqual(450);
    expect(comparables.every((item) => item.make === "BMW")).toBe(true);
  });

  it("covers a broader set of vehicle templates and simple market behavior patterns", () => {
    const modelKeys = new Set(mockPastListings.map((item) => `${item.make} ${item.model}`));
    const seasonalityValues = new Set(mockPastListings.map((item) => item.seasonalityIndex));
    const ageBuckets = new Set(mockPastListings.map((item) => item.listingAgeBucket));
    const dealers = mockPastListings.filter((item) => item.sellerType === "dealer");
    const privateSellers = mockPastListings.filter((item) => item.sellerType === "private");
    const averageDealerResponse = average(dealers.map((item) => item.sellerResponseTimeHours));
    const averagePrivateResponse = average(privateSellers.map((item) => item.sellerResponseTimeHours));

    expect(modelKeys.size).toBeGreaterThanOrEqual(20);
    expect(seasonalityValues.size).toBeGreaterThan(4);
    expect(ageBuckets).toEqual(new Set(["first-week", "active", "aging", "stale"]));
    expect(averageDealerResponse).toBeLessThan(averagePrivateResponse);
    expect(dealers.some((item) => item.dealerCertified)).toBe(true);
    expect(privateSellers.every((item) => !item.dealerCertified)).toBe(true);
  });
});

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
