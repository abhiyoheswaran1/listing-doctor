import { describe, expect, it } from "vitest";

import {
  descriptionLanguageChevronClassName,
  descriptionLanguageSelectClassName,
} from "./description-assistant-ui";

describe("description assistant UI classes", () => {
  it("keeps the language selector compact despite global select styles", () => {
    expect(descriptionLanguageSelectClassName).toContain("!w-[156px]");
    expect(descriptionLanguageSelectClassName).toContain("!h-10");
    expect(descriptionLanguageSelectClassName).toContain("appearance-none");
    expect(descriptionLanguageSelectClassName).toContain("pr-9");
    expect(descriptionLanguageSelectClassName).not.toContain("w-full");
  });

  it("positions the custom chevron without blocking select interaction", () => {
    expect(descriptionLanguageChevronClassName).toContain("pointer-events-none");
    expect(descriptionLanguageChevronClassName).toContain("absolute");
    expect(descriptionLanguageChevronClassName).toContain("right-3");
  });
});
