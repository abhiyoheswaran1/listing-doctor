import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("Button", () => {
  it("renders a native button so insertion-flow actions keep native click semantics", async () => {
    vi.stubGlobal("React", React);
    const { Button } = await import("./button");
    const onClick = vi.fn();
    const element = Button({ children: "Continue to version", onClick, disabled: true });

    expect(element.type).toBe("button");
    expect(element.props.type).toBe("button");
    expect(element.props.disabled).toBe(true);
    expect(element.props.onClick).toBe(onClick);
  });
});
