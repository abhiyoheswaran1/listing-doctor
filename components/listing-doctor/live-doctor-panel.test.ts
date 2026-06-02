import { describe, expect, it } from "vitest";

import { getActionDetailClassName } from "../../lib/listing-doctor/liveDoctorPanelClasses";

describe("LiveDoctorPanel", () => {
  it("keeps current section action detail fully visible", () => {
    const className = getActionDetailClassName();

    expect(className).not.toContain("line-clamp");
    expect(className).not.toContain("doctor-priority-detail");
    expect(className).toContain("doctor-action-detail");
  });
});
