import { describe, expect, it } from "bun:test";
import { SchemaClass } from "../../../modules/core";
import { z } from "zod";

describe("SchemaClass", () => {
  it("should create a class from a shape and assign input to instance", () => {
    class Entity extends SchemaClass({ id: z.string(), name: z.string() }) {}
    const instance = new Entity({ id: "1", name: "foo" });

    expect(instance.id).toBe("1");
    expect(instance.name).toBe("foo");
  });

  it("should expose _shape on the class (static)", () => {
    const shape = { id: z.string(), price: z.number() };
    class Product extends SchemaClass(shape) {}

    expect(Product._shape).toBe(shape);
    expect(Product._shape.id).toBe(shape.id);
    expect(Product._shape.price).toBe(shape.price);
  });

  it("should expose _shape on each instance", () => {
    const shape = { id: z.string(), price: z.number() };
    class Product extends SchemaClass(shape) {}
    const p = new Product({ id: "x", price: 99 });

    expect(p._shape).toBe(shape);
    expect(p.id).toBe("x");
    expect(p.price).toBe(99);
  });

  it("should support single-field shape", () => {
    const shape = { value: z.string() };
    class UserId extends SchemaClass(shape) {}
    const id = new UserId({ value: "user-1" });

    expect(id.value).toBe("user-1");
    expect(id._shape).toBe(shape);
  });

  it("should not validate at runtime (assigns input as-is)", () => {
    class Person extends SchemaClass({ age: z.number().min(0).max(150) }) {}
    const p = new Person({ age: -1 } as { age: number });

    expect(p.age).toBe(-1);
  });

  it("subclass can be used as a type", () => {
    class Entity extends SchemaClass({ id: z.string(), name: z.string() }) {}
    const instance = new Entity({ id: "1", name: "foo" });
    const asType: Entity = instance;

    expect(asType.id).toBe("1");
    expect(asType.name).toBe("foo");
  });

  it("subclass can be extended with methods", () => {
    class Entity extends SchemaClass({ id: z.string(), name: z.string() }) {
      get label() {
        return `${this.name} (#${this.id})`;
      }
    }
    const e = new Entity({ id: "1", name: "foo" });

    expect(e.label).toBe("foo (#1)");
  });
});
