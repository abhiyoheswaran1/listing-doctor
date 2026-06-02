import { describe, expect, it } from "vitest";

import { demoListings, emptyListingDraft } from "./demoListings";
import { getInsertionFlowState } from "./flow";

describe("insertion flow state", () => {
  it("locks version and listing-data pages until catalogue identification is valid", () => {
    const state = getInsertionFlowState({
      listing: emptyListingDraft,
      activePage: "identify",
      completion: 0,
    });

    expect(state.validProductionDate).toBe(false);
    expect(state.canOpenPage("identify")).toBe(true);
    expect(state.canOpenPage("version")).toBe(false);
    expect(state.canOpenPage("details")).toBe(false);
    expect(state.canContinue).toBe(false);
    expect(state.footerStatus).toBe("Select a valid catalogue production date");
  });

  it("unlocks version after catalogue identification, then listing data after version selection", () => {
    const bmw = demoListings[0];
    const identifyState = getInsertionFlowState({
      listing: { ...bmw, version: "" },
      activePage: "identify",
      completion: 100,
    });

    expect(identifyState.canOpenPage("version")).toBe(true);
    expect(identifyState.canOpenPage("details")).toBe(false);
    expect(identifyState.canContinue).toBe(true);
    expect(identifyState.nextPage).toBe("version");

    const versionState = getInsertionFlowState({
      listing: bmw,
      activePage: "version",
      completion: 100,
    });

    expect(versionState.versionSelected).toBe(true);
    expect(versionState.canOpenPage("details")).toBe(true);
    expect(versionState.nextPage).toBe("details");
    expect(versionState.footerStatus).toBe("Version selected, continue to listing data");
  });

  it("only marks the listing data page complete while the seller is on the live Coach page", () => {
    const bmw = demoListings[0];
    const identifyState = getInsertionFlowState({
      listing: bmw,
      activePage: "identify",
      completion: 100,
    });
    const detailsState = getInsertionFlowState({
      listing: bmw,
      activePage: "details",
      completion: 100,
    });

    expect(identifyState.isPageComplete("details")).toBe(false);
    expect(detailsState.isPageComplete("details")).toBe(true);
    expect(detailsState.footerStatus).toBe("Live score available");
  });
});
