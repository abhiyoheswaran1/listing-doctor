import { describe, expect, it } from "vitest";

import { getVersionsForProductionDate, isValidProductionDate } from "./catalogue";
import { completePhotoChecklist, demoListings } from "./demoListings";
import { generateReport } from "./generateReport";

describe("demoListings", () => {
  it("keeps photo counts aligned with uploaded image rows", () => {
    for (const listing of demoListings) {
      expect(listing.uploadedImages, listing.id).toHaveLength(listing.photoCount);
    }
  });

  it("keeps the guided demo recoverable and visibly improvable", () => {
    const guidedDemo = demoListings[0];
    const availableVersions = getVersionsForProductionDate(
      guidedDemo.make,
      guidedDemo.model,
      guidedDemo.productionMonth ?? "",
      guidedDemo.productionYear ?? 0,
    );
    const initialReport = generateReport(guidedDemo);
    const improvedReport = generateReport({
      ...guidedDemo,
      mfkStatus: "valid",
      serviceHistoryStatus: "complete",
      accidentHistoryStatus: "accident-free",
      warrantyStatus: "dealer warranty",
      description:
        "Well maintained Swiss BMW 320d Touring with documented service work, valid MFK, accident-free bodywork, two keys, navigation, automatic transmission, winter wheels, and clear handover details. Recent maintenance and tyre condition are available for viewing.",
      photoCount: 16,
      photoChecklist: completePhotoChecklist,
      uploadedImages: Array.from({ length: 16 }, (_, index) => ({
        id: `guided-proof-${index + 1}`,
        name: `guided-proof-${index + 1}.jpg`,
        coverage: index < 10 ? completePhotoCoverage[index] : "other",
      })),
      keyFeatures: [
        "Automatic",
        "Navigation",
        "Winter wheels",
        "Two keys",
        "Valid MFK",
      ],
    });

    expect(guidedDemo.id).toBe("demo-bmw-320d-weak");
    expect(guidedDemo.name).toMatch(/Guided demo/);
    expect(isValidProductionDate(
      guidedDemo.make,
      guidedDemo.model,
      guidedDemo.productionMonth ?? "",
      guidedDemo.productionYear ?? 0,
    )).toBe(true);
    expect(availableVersions.some((version) => version.name === guidedDemo.version)).toBe(true);
    expect(improvedReport.scores.overall - initialReport.scores.overall).toBeGreaterThanOrEqual(20);
  });
});

const completePhotoCoverage = [
  "frontExterior",
  "rearExterior",
  "leftSide",
  "rightSide",
  "interior",
  "dashboard",
  "odometer",
  "tyres",
  "serviceBook",
  "defectsDamage",
] as const;
