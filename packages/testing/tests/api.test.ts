import { describe, it, expect, vi } from "../index";

describe("Unified Testing API", () => {
  it("should have basic test primitives", () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it("should work with expect", () => {
    expect(1 + 1).toBe(2);
    expect({ a: 1 }).toEqual({ a: 1 });
  });

  it("should work with vi.fn()", () => {
    const mock = vi.fn((x: number) => x * 2);
    expect(mock(2)).toBe(4);
    expect(mock).toHaveBeenCalled();
    expect(mock).toHaveBeenCalledWith(2);
  });
});
