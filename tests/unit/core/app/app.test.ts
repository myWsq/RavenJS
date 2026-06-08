import { describe, test, expect } from "vitest";
import { Raven } from "../../../../packages/core/index.ts";

describe("Raven Basic Server", () => {
  test("should initialize correctly", () => {
    const app = new Raven();
    expect(app).toBeDefined();
  });
});
