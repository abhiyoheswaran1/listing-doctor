import { describe, expect, it } from "vitest";

import { getSetupProgress } from "./live-doctor-panel";
import { demoListings } from "../../lib/listing-doctor/demoListings";
import { getActionDetailClassName } from "../../lib/listing-doctor/liveDoctorPanelClasses";

describe("LiveDoctorPanel", () => {
  it("keeps current section action detail fully visible", () => {
    const className = getActionDetailClassName();

    expect(className).not.toContain("line-clamp");
    expect(className).not.toContain("doctor-priority-detail");
    expect(className).toContain("doctor-action-detail");
  });

  it("does not mark exact version complete on the identify page even when demo data is prefilled", () => {
    const steps = getSetupProgress({
      listing: demoListings[0],
      page: "identify",
      enabled: false,
    });

    expect(steps).toEqual([
      {
        done: true,
        label: "Catalogue identity",
        value: "BMW 320d Touring",
      },
      {
        done: false,
        label: "Exact version",
        value: "Pick a version",
      },
      {
        done: false,
        label: "Live coaching",
        value: "Starts on listing data",
      },
    ]);
  });
});
