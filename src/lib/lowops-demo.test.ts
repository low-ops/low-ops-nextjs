import { describe, expect, it } from "vitest";

describe("LowOps demo tests", () => {
  it("passes", () => {
    expect(1 + 1).toBe(2);
  });

  it.skip("skipped for LowOps UI", () => {
    expect(true).toBe(false);
  });

  it("fails for LowOps UI", () => {
    expect("expected").toBe("actual");
  });
});
