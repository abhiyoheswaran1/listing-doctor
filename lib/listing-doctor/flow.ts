import {
  getVersionsForProductionDate,
  isValidProductionDate,
  type CatalogueVersion,
} from "./catalogue";
import type { ListingDraft } from "./types";

export type InsertionPage = "identify" | "version" | "details";

export const insertionPages: Array<{ id: InsertionPage; label: string; detail: string }> = [
  { id: "identify", label: "Identify", detail: "Make, model, production date" },
  { id: "version", label: "Version", detail: "Catalogue version match" },
  { id: "details", label: "Listing data", detail: "Trust, price, equipment, images" },
];

export type InsertionFlowState = {
  activePage: InsertionPage;
  validProductionDate: boolean;
  availableVersions: CatalogueVersion[];
  versionSelected: boolean;
  canContinue: boolean;
  continueLabel: string;
  footerStatus: string;
  nextPage: InsertionPage | null;
  previousPage: InsertionPage | null;
  canOpenPage: (page: InsertionPage) => boolean;
  isPageComplete: (page: InsertionPage) => boolean;
};

export function getInsertionFlowState({
  listing,
  activePage,
  completion,
}: {
  listing: ListingDraft;
  activePage: InsertionPage;
  completion: number;
}): InsertionFlowState {
  const validProductionDate = isValidProductionDate(
    listing.make,
    listing.model,
    listing.productionMonth ?? "",
    listing.productionYear ?? 0,
  );
  const availableVersions = getVersionsForProductionDate(
    listing.make,
    listing.model,
    listing.productionMonth ?? "",
    listing.productionYear ?? 0,
  );
  const versionSelected = availableVersions.some((version) => version.name === listing.version);
  const activePageIndex = insertionPages.findIndex((page) => page.id === activePage);
  const hasReachedPage = (page: InsertionPage) =>
    activePageIndex >= insertionPages.findIndex((item) => item.id === page);

  const canOpenPage = (page: InsertionPage) => {
    if (page === "identify") return true;
    if (page === "version") return validProductionDate;
    return validProductionDate && versionSelected && hasReachedPage("version");
  };

  const isPageComplete = (page: InsertionPage) => {
    if (page === "identify") return validProductionDate;
    if (page === "version") return hasReachedPage("version") && versionSelected;
    return activePage === "details" && completion === 100;
  };

  const nextPage =
    activePage === "identify" && validProductionDate
      ? "version"
      : activePage === "version" && versionSelected
        ? "details"
        : null;
  const previousPage =
    activePage === "details" ? "version" : activePage === "version" ? "identify" : null;
  const canContinue =
    activePage === "identify"
      ? validProductionDate
      : activePage === "version"
        ? versionSelected
        : true;

  return {
    activePage,
    validProductionDate,
    availableVersions,
    versionSelected,
    canContinue,
    continueLabel:
      activePage === "identify"
        ? "Continue to version"
        : activePage === "version"
          ? "Continue to listing data"
          : "Continue",
    footerStatus: getFooterStatus(activePage, validProductionDate, versionSelected),
    nextPage,
    previousPage,
    canOpenPage,
    isPageComplete,
  };
}

function getFooterStatus(
  activePage: InsertionPage,
  validProductionDate: boolean,
  versionSelected: boolean,
) {
  if (!validProductionDate) return "Select a valid catalogue production date";
  if (activePage === "identify") return "Catalogue identity ready for version selection";
  if (!versionSelected) return "Select the exact version to unlock live coaching";
  if (activePage === "version") return "Version selected, continue to listing data";
  return "Live score available";
}
