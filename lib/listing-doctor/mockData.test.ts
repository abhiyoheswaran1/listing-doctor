import { describe, expect, it } from "vitest";

import { generateMockListing } from "./mockData";

describe("generateMockListing", () => {
  it("creates deterministic Swiss demo drafts from a seed", () => {
    const first = generateMockListing("zurich-demo-1");
    const second = generateMockListing("zurich-demo-1");
    const different = generateMockListing("geneva-demo-2");

    expect(first).toEqual(second);
    expect(first.id).toContain("mock-zurich-demo-1");
    expect(first.priceChf).toBeGreaterThan(2500);
    expect(first.mileageKm).toBeGreaterThan(5000);
    expect(first.description.length).toBeGreaterThan(20);
    expect(first).not.toEqual(different);
  });

  it("keeps generated image counts in sync with uploaded image rows", () => {
    const listing = generateMockListing("zurich-demo-1");

    expect(listing.uploadedImages).toHaveLength(listing.photoCount);
  });
});
