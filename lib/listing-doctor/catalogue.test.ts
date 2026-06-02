import { describe, expect, it } from "vitest";

import {
  getCatalogueMakes,
  getCatalogueModels,
  getProductionMonths,
  getProductionYears,
  getVersionsForProductionDate,
  isValidProductionDate,
} from "./catalogue";

describe("vehicle catalogue", () => {
  it("exposes make and model choices from catalogue data", () => {
    expect(getCatalogueMakes()).toEqual(
      expect.arrayContaining(["BMW", "Tesla", "Toyota", "Volkswagen"]),
    );
    expect(getCatalogueModels("BMW")).toEqual(expect.arrayContaining(["320d Touring"]));
  });

  it("only returns production years and months that exist for a model", () => {
    expect(getProductionYears("BMW", "320d Touring")).toContain(2016);
    expect(getProductionYears("BMW", "320d Touring")).not.toContain(2026);

    expect(getProductionMonths("BMW", "320d Touring", 2016)).toContain("April");
    expect(getProductionMonths("BMW", "320d Touring", 2019)).not.toContain("December");
  });

  it("filters versions by the selected production month and year", () => {
    expect(isValidProductionDate("BMW", "320d Touring", "April", 2016)).toBe(true);
    expect(isValidProductionDate("BMW", "320d Touring", "December", 2019)).toBe(false);

    const versions = getVersionsForProductionDate("BMW", "320d Touring", "April", 2016);

    expect(versions.map((version) => version.name)).toEqual(
      expect.arrayContaining(["xDrive Steptronic", "Sport Line", "Luxury Line"]),
    );
  });
});
