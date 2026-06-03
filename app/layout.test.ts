import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

describe("RootLayout", () => {
  it("suppresses document-level hydration warnings from browser extension body attributes", async () => {
    vi.stubGlobal("React", React);
    const { default: RootLayout } = await import("./layout");

    const element = RootLayout({ children: "content" });
    const body = element.props.children;

    expect(body.type).toBe("body");
    expect(body.props.suppressHydrationWarning).toBe(true);
  });
});
