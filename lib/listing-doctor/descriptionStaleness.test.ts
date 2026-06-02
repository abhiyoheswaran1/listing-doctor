import { describe, expect, test } from "vitest";

import { demoListings } from "./demoListings";
import {
  createDescriptionSnapshot,
  getDescriptionStaleness,
} from "./descriptionStaleness";

describe("description staleness", () => {
  test("marks generated description stale when an important trust field changes", () => {
    const listing = demoListings.find((item) => item.id === "demo-bmw-320d-weak")!;
    const snapshot = createDescriptionSnapshot(listing, "scratch", "generated copy");

    const result = getDescriptionStaleness(
      {
        ...listing,
        mfkStatus: "valid",
      },
      snapshot,
    );

    expect(result.isStale).toBe(true);
    expect(result.changedFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "mfkStatus",
          label: "MFK",
          before: "unknown",
          after: "valid",
        }),
      ]),
    );
    expect(result.summary).toMatch(/MFK changed from unknown to valid/i);
  });

  test("does not mark generated description stale when tracked source fields are unchanged", () => {
    const listing = demoListings.find((item) => item.id === "demo-toyota-rav4-strong")!;
    const snapshot = createDescriptionSnapshot(listing, "polish", listing.description);

    const result = getDescriptionStaleness({ ...listing, name: "Renamed draft" }, snapshot);

    expect(result.isStale).toBe(false);
    expect(result.changedFields).toHaveLength(0);
  });

  test("tracks equipment and seller-note changes because generated copy can mention them", () => {
    const listing = demoListings.find((item) => item.id === "demo-tesla-model-y-premium")!;
    const snapshot = createDescriptionSnapshot(listing, "scratch", "generated copy");

    const result = getDescriptionStaleness(
      {
        ...listing,
        keyFeatures: [...listing.keyFeatures, "New summer tyres"],
        sellerNotes: "Charging cable no longer included.",
      },
      snapshot,
    );

    expect(result.isStale).toBe(true);
    expect(result.changedFields.map((item) => item.field)).toEqual(
      expect.arrayContaining(["keyFeatures", "sellerNotes"]),
    );
  });
});
