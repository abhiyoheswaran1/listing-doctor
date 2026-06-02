import { describe, expect, it } from "vitest";

import { analyzeListing } from "./analyze";
import type { ListingDraft } from "./types";

const completePhotoChecklist = {
  frontExterior: true,
  rearExterior: true,
  leftSide: true,
  rightSide: true,
  interior: true,
  dashboard: true,
  odometer: true,
  tyres: true,
  serviceBook: true,
  defectsDamage: true,
};

describe("analyzeListing", () => {
  it("flags a risky listing with missing trust signals, weak photos, pricing risk, and buyer objections", () => {
    const riskyGolf: ListingDraft = {
      id: "test-risky-golf",
      name: "Risky VW Golf",
      make: "Volkswagen",
      model: "Golf 1.4 TSI",
      year: 2013,
      priceChf: 3900,
      mileageKm: 186000,
      fuelType: "Petrol",
      transmission: "Manual",
      bodyType: "Hatchback",
      sellerType: "private",
      mfkStatus: "missing",
      serviceHistoryStatus: "unknown",
      accidentHistoryStatus: "unknown",
      warrantyStatus: "none",
      description: "Good car. Must sell quickly. Call me.",
      photoCount: 4,
      photoChecklist: {
        ...completePhotoChecklist,
        interior: false,
        dashboard: false,
        odometer: false,
        tyres: false,
        serviceBook: false,
        defectsDamage: false,
      },
      keyFeatures: [],
      sellerNotes: "Cheap because I need space.",
    };

    const result = analyzeListing(riskyGolf);

    expect(result.readiness).toBe("High risk, fix first");
    expect(result.scores.overall).toBeLessThan(45);
    expect(result.scores.trust).toBeLessThan(35);
    expect(result.scores.photoCompleteness).toBeLessThan(50);
    expect(result.topFixes[0]?.title).toMatch(/MFK|trust|accident|service/i);
    expect(result.missingTrustSignals).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/MFK/i),
        expect.stringMatching(/service/i),
        expect.stringMatching(/accident/i),
      ]),
    );
    expect(result.pricingFeedback.concern).toMatch(/below|cheap|explain/i);
    expect(result.buyerQuestions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/MFK/i),
        expect.stringMatching(/accident/i),
      ]),
    );
  });

  it("recognizes a well documented listing as ready to publish", () => {
    const strongRav4: ListingDraft = {
      id: "test-rav4",
      name: "Strong Toyota RAV4",
      make: "Toyota",
      model: "RAV4 Hybrid",
      year: 2020,
      priceChf: 31900,
      mileageKm: 68000,
      fuelType: "Hybrid",
      transmission: "Automatic",
      bodyType: "SUV",
      sellerType: "dealer",
      mfkStatus: "valid",
      serviceHistoryStatus: "complete",
      accidentHistoryStatus: "accident-free",
      warrantyStatus: "dealer warranty",
      description:
        "Well maintained Swiss vehicle with complete Toyota service history, fresh MFK, accident-free bodywork, two keys, winter wheels, adaptive cruise control, navigation, reversing camera, and documented hybrid system checks.",
      photoCount: 18,
      photoChecklist: completePhotoChecklist,
      keyFeatures: [
        "Adaptive cruise control",
        "Navigation",
        "Rear camera",
        "Winter wheels",
        "Hybrid system check",
      ],
      sellerNotes: "Includes dealer warranty and fresh detailing.",
    };

    const result = analyzeListing(strongRav4);

    expect(result.readiness).toBe("Ready to publish");
    expect(result.scores.overall).toBeGreaterThanOrEqual(80);
    expect(result.scores.trust).toBeGreaterThanOrEqual(85);
    expect(result.scores.descriptionQuality).toBeGreaterThanOrEqual(80);
    expect(result.scores.photoCompleteness).toBeGreaterThanOrEqual(90);
    expect(result.topFixes.length).toBeLessThanOrEqual(5);
    expect(result.predictiveInsights.mode).toBe("simulated-ml");
    expect(result.predictiveInsights.comparableCount).toBeGreaterThan(0);
    expect(result.predictiveInsights.leadLiftRange.high).toBeGreaterThan(
      result.predictiveInsights.leadLiftRange.low,
    );
    expect(result.predictiveInsights.performanceSignals).toEqual(
      expect.arrayContaining([expect.stringMatching(/synthetic/i)]),
    );
  });

  it("does not tell ready listings to rewrite the description for minor copy improvements", () => {
    const strongRav4: ListingDraft = {
      id: "test-ready-description-copy",
      name: "Strong Toyota RAV4",
      make: "Toyota",
      model: "RAV4 Hybrid",
      version: "Style AWD",
      year: 2021,
      productionMonth: "June",
      productionYear: 2021,
      firstRegistrationMonth: "June",
      firstRegistrationYear: 2021,
      priceChf: 31900,
      mileageKm: 68000,
      fuelType: "Hybrid",
      transmission: "Automatic",
      bodyType: "SUV",
      sellerType: "dealer",
      mfkStatus: "valid",
      serviceHistoryStatus: "complete",
      accidentHistoryStatus: "accident-free",
      warrantyStatus: "dealer warranty",
      description:
        "Well maintained Swiss vehicle with complete Toyota service history, valid MFK, accident-free bodywork, dealer warranty, navigation, reversing camera, winter wheels, and documented hybrid system checks.",
      photoCount: 18,
      photoChecklist: completePhotoChecklist,
      keyFeatures: ["Navigation", "Rear camera", "Winter wheels"],
      standardEquipment: [
        "Adaptive cruise control",
        "Navigation system",
        "Reversing camera",
        "LED headlights",
        "Air conditioning",
        "Bluetooth interface",
        "DAB radio",
        "Cruise control",
        "Central locking",
        "Tyre pressure monitoring",
        "Parking sensors",
        "Isofix child seat mounts",
      ],
    };

    const result = analyzeListing(strongRav4);

    expect(result.readiness).toBe("Ready to publish");
    expect(result.topFixes).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: expect.stringMatching(/rewrite the description/i),
        }),
      ]),
    );
  });

  it("flags a 10-year-old high-mileage BMW priced too close to a fake new-price anchor as above benchmark", () => {
    const oldHighMileageBmw: ListingDraft = {
      id: "test-bmw-price",
      name: "BMW 320d Touring",
      make: "BMW",
      model: "320d Touring",
      version: "xDrive Steptronic",
      year: 2016,
      firstRegistrationMonth: "April",
      firstRegistrationYear: 2016,
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
      description:
        "BMW 320d Touring with valid MFK, complete service history, accident-free history, xDrive, navigation, winter wheels, and transparent condition notes.",
      photoCount: 12,
      photoChecklist: completePhotoChecklist,
      keyFeatures: ["xDrive", "Navigation", "Winter wheels"],
    };

    const result = analyzeListing(oldHighMileageBmw);

    expect(result.pricingFeedback.originalNewPriceEstimate).toBeGreaterThan(55000);
    expect(result.pricingFeedback.position).toBe("above");
    expect(result.pricingFeedback.benchmarkHigh).toBeLessThan(oldHighMileageBmw.priceChf);
    expect(result.pricingFeedback.concern).toMatch(/10 years old/i);
    expect(result.pricingFeedback.concern).toMatch(/174/i);
  });

  it("keeps product-facing market feedback free of implementation labels", () => {
    const bmw: ListingDraft = {
      id: "test-market-copy",
      name: "BMW 320d Touring",
      make: "BMW",
      model: "320d Touring",
      version: "xDrive Steptronic",
      year: 2016,
      firstRegistrationMonth: "April",
      firstRegistrationYear: 2016,
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
      description:
        "BMW 320d Touring with valid MFK, complete service history, accident-free history, xDrive, navigation, winter wheels, and transparent condition notes.",
      photoCount: 12,
      photoChecklist: completePhotoChecklist,
      keyFeatures: ["xDrive", "Navigation", "Winter wheels"],
    };

    const result = analyzeListing(bmw);
    const marketText = [
      result.pricingFeedback.concern,
      ...result.pastListingInsights,
    ].join(" ");

    expect(marketText).not.toMatch(/\bmock|mocked|synthetic\b/i);
    expect(marketText).toMatch(/comparable|historical|benchmark/i);
  });

  it("does not require defects or damage photos when accident history is accident-free", () => {
    const accidentFreeDraft: ListingDraft = {
      id: "test-photo-no-damage-required",
      name: "Accident-free Toyota",
      make: "Toyota",
      model: "RAV4 Hybrid",
      year: 2021,
      priceChf: 33000,
      mileageKm: 52000,
      fuelType: "Hybrid",
      transmission: "Automatic",
      bodyType: "SUV",
      sellerType: "dealer",
      mfkStatus: "valid",
      serviceHistoryStatus: "complete",
      accidentHistoryStatus: "accident-free",
      warrantyStatus: "dealer warranty",
      description:
        "Accident-free Swiss vehicle with valid MFK, complete service history, warranty, navigation, rear camera, winter wheels, and clear handover documentation.",
      photoCount: 14,
      photoChecklist: {
        ...completePhotoChecklist,
        defectsDamage: false,
      },
      keyFeatures: ["Navigation", "Rear camera", "Winter wheels"],
    };

    const result = analyzeListing(accidentFreeDraft);

    expect(result.photoImprovements).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/defects|damage/i)]),
    );
    expect(result.scores.photoCompleteness).toBeGreaterThanOrEqual(85);
  });

  it("requires defects or damage photos when repaired or current damage is declared", () => {
    const repairedDraft: ListingDraft = {
      id: "test-photo-damage-required",
      name: "Repaired VW Golf",
      make: "Volkswagen",
      model: "Golf 1.4 TSI",
      year: 2017,
      priceChf: 10500,
      mileageKm: 98000,
      fuelType: "Petrol",
      transmission: "Manual",
      bodyType: "Hatchback",
      sellerType: "private",
      mfkStatus: "valid",
      serviceHistoryStatus: "partial",
      accidentHistoryStatus: "repaired",
      warrantyStatus: "none",
      description:
        "VW Golf with valid MFK, partial service history, repaired rear bumper damage, summer tyres, navigation, and transparent condition notes.",
      photoCount: 14,
      photoChecklist: {
        ...completePhotoChecklist,
        defectsDamage: false,
      },
      keyFeatures: ["Navigation", "Summer tyres", "Parking sensors"],
    };

    const result = analyzeListing(repairedDraft);

    expect(result.photoImprovements).toEqual(
      expect.arrayContaining([expect.stringMatching(/defects|damage/i)]),
    );
    expect(result.scores.photoCompleteness).toBeLessThan(90);
  });

  it("scores full insertion-flow data with explainable point categories and market samples", () => {
    const fullTeslaDraft: ListingDraft = {
      id: "test-full-tesla",
      name: "Full Tesla Model Y insertion draft",
      make: "Tesla",
      model: "Model Y",
      version: "Long Range AWD",
      year: 2023,
      firstRegistrationMonth: "March",
      firstRegistrationYear: 2023,
      priceChf: 55900,
      mileageKm: 37000,
      fuelType: "Electric",
      transmission: "Automatic",
      bodyType: "SUV / off-road vehicle",
      sellerType: "dealer",
      mfkStatus: "valid",
      serviceHistoryStatus: "complete",
      accidentHistoryStatus: "accident-free",
      warrantyStatus: "battery warranty",
      exteriorColor: "White",
      interiorColor: "Black",
      metallic: false,
      standardEquipment: [
        "Adaptive cruise control",
        "LED headlights",
        "Navigation system",
        "Lane keeping assistant",
        "Emergency braking assistant",
        "DAB radio",
        "Heated front seats",
        "Panoramic glass roof",
        "Reversing camera",
        "Parking sensors",
        "Isofix child seat mounts",
        "Keyless entry",
      ],
      optionalEquipment: ["Enhanced Autopilot", "Winter wheels", "Tow hitch preparation"],
      retrofits: ["Ceramic paint protection"],
      technicalData: {
        doors: 5,
        seats: 5,
        powerHp: 514,
        powerKw: 378,
        emptyWeightKg: 2048,
        towingCapacityBrakedKg: 1600,
        lengthMm: 4751,
        widthMm: 1921,
        heightMm: 1624,
        typeApprovalNumber: "1TE123",
        vehicleIdentificationNumber: "LRWYGCEE0PC123456",
        serialNumber: "AS24-TESLA-001",
        vehicleNumber: "ZH-2023-5544",
        energyLabel: "A",
      },
      batteryData: {
        rangeKm: 533,
        batteryCapacityKWh: 75,
        batteryOwnershipModel: "Included in purchase price",
        batteryHealthPercent: 94,
        hasBatteryHealthCertificate: true,
        chargingPlugAc: "Type 2",
        chargingPowerAcKw: 11,
        chargingTimeAcMinutes: 420,
        chargingPlugDc: "CCS",
        chargingPowerDcKw: 250,
        chargingTimeDcMinutes: 28,
        chargingCableIncluded: true,
      },
      description:
        "Swiss Tesla Model Y Long Range AWD with valid MFK, complete documentation, remaining battery warranty, Type 2 charging cable, winter wheels, Enhanced Autopilot, accident-free history, and full photo documentation.",
      photoCount: 22,
      uploadedImages: [
        { id: "front", name: "front.jpg", coverage: "frontExterior" },
        { id: "rear", name: "rear.jpg", coverage: "rearExterior" },
        { id: "interior", name: "interior.jpg", coverage: "interior" },
        { id: "dash", name: "dashboard.jpg", coverage: "dashboard" },
        { id: "odo", name: "odometer.jpg", coverage: "odometer" },
        { id: "tyres", name: "tyres.jpg", coverage: "tyres" },
      ],
      photoChecklist: completePhotoChecklist,
      keyFeatures: ["Enhanced Autopilot", "Winter wheels", "Battery warranty"],
      sellerNotes: "Premium price reflects documentation, warranty, and complete photos.",
    };

    const result = analyzeListing(fullTeslaDraft);

    expect(result.pricingFeedback.sampleSize).toBeGreaterThanOrEqual(100);
    expect(result.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "vehicle-identification", earned: 12, possible: 12 }),
        expect.objectContaining({ id: "equipment", possible: 12 }),
        expect.objectContaining({ id: "battery-data", earned: 12, possible: 12 }),
        expect.objectContaining({ id: "market-position", possible: 12 }),
      ]),
    );
    expect(result.pastListingInsights.length).toBeGreaterThanOrEqual(3);
    expect(result.scores.overall).toBeGreaterThanOrEqual(85);
  });

  it("does not penalize a listing just because it has no optional equipment", () => {
    const noOptionalEquipmentDraft: ListingDraft = {
      id: "test-no-optional-equipment",
      name: "Toyota RAV4 with standard equipment confirmed",
      make: "Toyota",
      model: "RAV4 Hybrid",
      version: "Style AWD",
      year: 2021,
      productionMonth: "June",
      productionYear: 2021,
      firstRegistrationMonth: "June",
      firstRegistrationYear: 2021,
      priceChf: 29900,
      mileageKm: 72000,
      fuelType: "Hybrid",
      transmission: "Automatic",
      bodyType: "SUV",
      sellerType: "dealer",
      mfkStatus: "valid",
      serviceHistoryStatus: "complete",
      accidentHistoryStatus: "accident-free",
      warrantyStatus: "dealer warranty",
      description:
        "Toyota RAV4 Hybrid with valid MFK, complete service history, accident-free history, dealer warranty, rear camera, navigation, and winter wheels.",
      photoCount: 16,
      photoChecklist: completePhotoChecklist,
      keyFeatures: ["Navigation", "Rear camera", "Winter wheels"],
      standardEquipment: [
        "ABS and brake assist",
        "Adaptive cruise control",
        "Air conditioning",
        "Automatic emergency braking",
        "Bluetooth interface",
        "Central locking",
        "Cruise control",
        "DAB radio",
        "LED headlights",
        "Navigation system",
        "Rear parking sensors",
        "Reversing camera",
        "Tyre pressure monitoring",
      ],
      optionalEquipment: [],
      retrofits: [],
    };

    const result = analyzeListing(noOptionalEquipmentDraft);

    expect(result.scores.equipment).toBeGreaterThanOrEqual(80);
    expect(result.searchabilityImprovements).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/optional/i)]),
    );
    expect(result.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "equipment",
          detail: expect.stringMatching(/standard confirmed/i),
        }),
      ]),
    );
  });

  it("adds simulated buyer objection prediction to risky listings", () => {
    const riskyBmw: ListingDraft = {
      id: "test-predictive-bmw",
      name: "Weak BMW 320d Touring",
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
      mfkStatus: "unknown",
      serviceHistoryStatus: "partial",
      accidentHistoryStatus: "unknown",
      warrantyStatus: "none",
      description: "BMW Touring, good car.",
      photoCount: 4,
      photoChecklist: {
        ...completePhotoChecklist,
        dashboard: false,
        odometer: false,
        tyres: false,
        serviceBook: false,
        defectsDamage: false,
      },
      keyFeatures: ["Navigation"],
    };

    const result = analyzeListing(riskyBmw);

    expect(result.predictiveInsights.confidence).toMatch(/High|Medium|Low/);
    expect(result.predictiveInsights.likelyBuyerObjections).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/MFK|service|accident|diesel|mileage/i),
      ]),
    );
    expect(result.predictiveInsights.expectedLeadImpact).toMatch(/\+\d+%/);
  });
});
