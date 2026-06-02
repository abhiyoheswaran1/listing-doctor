import { describe, expect, it } from "vitest";

import { demoListings } from "./demoListings";
import { canDiagnoseDraft } from "./diagnosisReadiness";

describe("diagnosis readiness", () => {
  it("does not diagnose during catalogue identification before version and drivetrain are known", () => {
    const listing = {
      ...demoListings[0],
      version: "",
      fuelType: "",
      transmission: "",
      bodyType: "",
      description: "",
    };

    expect(canDiagnoseDraft(listing)).toBe(false);
  });

  it("can diagnose after version picking even before the seller writes a description", () => {
    expect(canDiagnoseDraft({ ...demoListings[0], description: "" })).toBe(true);
  });
});
