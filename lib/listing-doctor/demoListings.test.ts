import { describe, expect, it } from "vitest";

import { demoListings } from "./demoListings";

describe("demoListings", () => {
  it("keeps photo counts aligned with uploaded image rows", () => {
    for (const listing of demoListings) {
      expect(listing.uploadedImages, listing.id).toHaveLength(listing.photoCount);
    }
  });
});
