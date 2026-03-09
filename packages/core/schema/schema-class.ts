import type { StandardSchemaV1 } from "./standard-schema.ts";

type InferInputObj<T extends Record<string, StandardSchemaV1>> = {
  [K in keyof T]: StandardSchemaV1.InferInput<T[K]>;
};

type InferOutputObj<T extends Record<string, StandardSchemaV1>> = {
  [K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
};

type SchemaClassCtor<T extends Record<string, StandardSchemaV1>> = {
  new (input: InferInputObj<T>): InferOutputObj<T> & { _shape: T };
  _shape: T;
};

export function SchemaClass<T extends Record<string, StandardSchemaV1>>(
  shape: T,
): SchemaClassCtor<T> {
  const GeneratedSchemaClass = class {
    static _shape: T = shape;
    declare _shape: T;

    constructor(input: InferInputObj<T>) {
      Object.assign(this, input);
      this._shape = shape;
    }
  };

  return GeneratedSchemaClass as SchemaClassCtor<T>;
}
