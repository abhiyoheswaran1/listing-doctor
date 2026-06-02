import { describe, expect, it } from "vitest";

import { buildPriceBenchmark, estimateOriginalNewPrice } from "./pricing";
import type { ListingDraft } from "./types";

describe("pricing helpers", () => {
  it("does not derive estimated new price from the seller asking price", () => {
    const bmw: ListingDraft = {
      id: "price-bmw",
      name: "BMW 320d Touring",
      make: "BMW",
      model: "320d Touring",
      version: "xDrive Steptronic",
      year: 2016,
      priceChf: 13800,
      mileageKm: 174000,
      fuelType: "Diesel",
      transmission: "Automatic",
      bodyType: "Estate",
      sellerType: "private",
      mfkStatus: "valid",
      serviceHistoryStatus: "complete",
      accidentHistoryStatus: "accident-free",
      warrantyStatus: "none",
      description: "",
      photoCount: 0,
      photoChecklist: {
        frontExterior: false,
        rearExterior: false,
        leftSide: false,
        rightSide: false,
        interior: false,
        dashboard: false,
        odometer: false,
        tyres: false,
        serviceBook: false,
        defectsDamage: false,
      },
      keyFeatures: [],
    };

    expect(estimateOriginalNewPrice(bmw)).toBeGreaterThan(55000);
    expect(estimateOriginalNewPrice(bmw)).not.toBe(16284);
  });

  it("uses catalogue production year as the age fallback for comparison when registration year is not set", () => {
    const bmwWithoutRegistrationYear: ListingDraft = {
      id: "price-bmw-production-year",
      name: "BMW 320d Touring",
      make: "BMW",
      model: "320d Touring",
      version: "xDrive Steptronic",
      year: 2026,
      productionMonth: "April",
      productionYear: 2016,
      priceChf: 13800,
      mileageKm: 174000,
      fuelType: "Diesel",
      transmission: "Automatic",
      bodyType: "Estate",
      sellerType: "private",
      mfkStatus: "valid",
      serviceHistoryStatus: "complete",
      accidentHistoryStatus: "accident-free",
      warrantyStatus: "none",
      description: "",
      photoCount: 0,
      photoChecklist: {
        frontExterior: false,
        rearExterior: false,
        leftSide: false,
        rightSide: false,
        interior: false,
        dashboard: false,
        odometer: false,
        tyres: false,
        serviceBook: false,
        defectsDamage: false,
      },
      keyFeatures: [],
    };

    const benchmark = buildPriceBenchmark(bmwWithoutRegistrationYear, []);

    expect(benchmark.valuationFactors).toEqual(expect.arrayContaining(["10 years old"]));
    expect(benchmark.benchmarkHigh).toBeLessThan(20000);
  });
});
