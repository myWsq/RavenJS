import { describe, test, expect } from "bun:test";
import { Raven } from "../../../../modules/core";

describe("Raven Basic Server", () => {
  test("should initialize correctly", () => {
    const app = new Raven();
    expect(app).toBeDefined();
  });
});
