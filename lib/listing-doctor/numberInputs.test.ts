import { describe, expect, it } from "vitest";

import {
  parseRequiredNumberInputValue,
  requiredNumberInputValue,
} from "./numberInputs";

describe("number input helpers", () => {
  it("renders zero-valued required number fields as empty while editing", () => {
    expect(requiredNumberInputValue(0)).toBe("");
    expect(requiredNumberInputValue(undefined)).toBe("");
    expect(requiredNumberInputValue(123)).toBe("123");
  });

  it("keeps the draft state numeric when a required number field is cleared", () => {
    expect(parseRequiredNumberInputValue("")).toBe(0);
    expect(parseRequiredNumberInputValue("123")).toBe(123);
  });
});
