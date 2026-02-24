import { describe, it, expect } from "bun:test";
import { J } from "../../modules/jtd-validator";

describe("JTD Schema DSL", () => {
  it("should build correct JTD schema for object with required fields", () => {
    const schema = J.object({
      name: J.string(),
      age: J.int(),
    });

    expect(schema.schema).toEqual({
      properties: {
        name: { type: "string" },
        age: { type: "int32" },
      },
    });
  });

  it("should build correct JTD schema with optional fields", () => {
    const schema = J.object({
      name: J.string(),
      bio: J.string().optional(),
    });

    expect(schema.schema).toEqual({
      properties: {
        name: { type: "string" },
      },
      optionalProperties: {
        bio: { type: "string" },
      },
    });
  });

  it("should build correct JTD schema with nullable fields", () => {
    const schema = J.object({
      name: J.string().nullable(),
    });

    expect(schema.schema).toEqual({
      properties: {
        name: { type: "string", nullable: true },
      },
    });
  });

  it("should build correct JTD schema for arrays", () => {
    const schema = J.array(J.string());

    expect(schema.schema).toEqual({
      elements: { type: "string" },
    });
  });

  it("should build correct JTD schema for records", () => {
    const schema = J.record(J.int());

    expect(schema.schema).toEqual({
      values: { type: "int32" },
    });
  });

  it("should build correct JTD schema for enums", () => {
    const schema = J.enum(["active", "inactive", "pending"] as const);

    expect(schema.schema).toEqual({
      enum: ["active", "inactive", "pending"],
    });
  });
});
