// =============================================================================
// SECTION: Imports
// =============================================================================

import Ajv, { type ValidateFunction } from "ajv/dist/jtd";
import {
  BodyState,
  QueryState,
  ParamsState,
  HeadersState,
  RavenError,
} from "@raven.js/core";

// =============================================================================
// SECTION: JTD Schema Types
// =============================================================================

// Symbol used as a property key to mark a FieldSchema as optional.
// Using a Symbol (instead of a plain string key) prevents collisions with
// user-defined field names and keeps the "optional" flag invisible to
// for...in loops and JSON serialization.
export const OPTIONAL = Symbol("optional");

// All scalar types defined by the JTD (JSON Type Definition, RFC 8927) spec.
export type JTDType =
  | "boolean"
  | "string"
  | "timestamp"
  | "float32"
  | "float64"
  | "int8"
  | "int16"
  | "int32"
  | "uint8"
  | "uint16"
  | "uint32";

// A recursive union that covers every valid JTD schema form:
//   type      — scalar primitive
//   enum      — fixed set of string literals
//   elements  — homogeneous array
//   values    — string-keyed map
//   properties / optionalProperties — object with required and/or optional keys
//   discriminator + mapping — tagged union
//   ref       — reference to a definition
//   {}        — empty schema (accepts any value)
type JTDBaseSchema =
  | { type: JTDType; nullable?: true }
  | { enum: readonly string[]; nullable?: true }
  | { elements: JTDBaseSchema; nullable?: true }
  | { values: JTDBaseSchema; nullable?: true }
  | {
      properties?: Record<string, JTDBaseSchema>;
      optionalProperties?: Record<string, JTDBaseSchema>;
      nullable?: true;
    }
  | { discriminator: string; mapping: Record<string, JTDBaseSchema> }
  | { ref: string }
  | Record<string, never>;

export type JTDSchema = JTDBaseSchema;

// FieldSchema wraps a raw JTDBaseSchema and exposes two chainable modifiers:
//   .optional()  — marks the field as optional in an enclosing J.object()
//   .nullable()  — adds `nullable: true` to the underlying JTD schema
//
// The [OPTIONAL] symbol property is the runtime flag inspected by J.object()
// when separating required keys from optional ones.
export interface FieldSchema<T extends JTDBaseSchema = JTDBaseSchema> {
  readonly [OPTIONAL]?: true;
  readonly schema: T;
  optional(): FieldSchema<T> & { readonly [OPTIONAL]: true };
  nullable(): FieldSchema<T & { nullable: true }>;
}

// =============================================================================
// SECTION: Field Schema Factory
// =============================================================================

// Internal constructor for FieldSchema values.
// Attaches the fluent .optional() and .nullable() methods to a plain schema object.
// isOptional is threaded through so that .nullable() preserves the optional flag.
function createField<T extends JTDBaseSchema>(
  schema: T,
  isOptional?: true
): FieldSchema<T> {
  const field: FieldSchema<T> = {
    schema,
    optional() {
      return { ...this, [OPTIONAL]: true as const } as FieldSchema<T> & {
        readonly [OPTIONAL]: true;
      };
    },
    nullable() {
      const newField = createField(
        { ...schema, nullable: true as const },
        this[OPTIONAL]
      ) as FieldSchema<T & { nullable: true }>;
      if (this[OPTIONAL]) {
        return { ...newField, [OPTIONAL]: true as const } as typeof newField & {
          readonly [OPTIONAL]: true;
        };
      }
      return newField;
    },
  };
  if (isOptional) {
    (field as any)[OPTIONAL] = true;
  }
  return field;
}

// =============================================================================
// SECTION: Type Inference Utilities
// =============================================================================

// Maps a JTDType string literal to the corresponding TypeScript primitive.
type InferJTDType<T extends JTDType> = T extends "boolean"
  ? boolean
  : T extends "string" | "timestamp"
    ? string
    : T extends
          | "float32"
          | "float64"
          | "int8"
          | "int16"
          | "int32"
          | "uint8"
          | "uint16"
          | "uint32"
      ? number
      : never;

// Wraps Base in `Base | null` when the schema carries `nullable: true`.
type InferNullable<T, Base> = T extends { nullable: true } ? Base | null : Base;

// Extracts the TypeScript type from a FieldSchema wrapper.
type InferFieldSchema<T> = T extends FieldSchema<infer S> ? InferSchema<S> : never;

// Distributes over the T extends { readonly [OPTIONAL]: true } condition to
// separate which keys of an object-fields map are required vs. optional.
type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends { readonly [OPTIONAL]: true } ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends { readonly [OPTIONAL]: true } ? K : never;
}[keyof T];

// Recursively infers the TypeScript type for any JTD schema form.
// Priority order matches the JTD spec: type > enum > elements > values > properties.
type InferSchema<T> = T extends { type: infer U extends JTDType }
  ? InferNullable<T, InferJTDType<U>>
  : T extends { enum: readonly (infer E)[] }
    ? InferNullable<T, E>
    : T extends { elements: infer E extends JTDBaseSchema }
      ? InferNullable<T, InferSchema<E>[]>
      : T extends { values: infer V extends JTDBaseSchema }
        ? InferNullable<T, Record<string, InferSchema<V>>>
        : T extends {
              properties: infer P;
              optionalProperties?: infer O;
            }
          ? InferNullable<
              T,
              { [K in keyof P]: InferSchema<P[K]> } & {
                [K in keyof O]?: InferSchema<O[K]>;
              }
            >
          : T extends { properties: infer P }
            ? InferNullable<T, { [K in keyof P]: InferSchema<P[K]> }>
            : T extends { optionalProperties: infer O }
              ? InferNullable<T, { [K in keyof O]?: InferSchema<O[K]> }>
              : unknown;

// Public utility type: infer the TypeScript type from a FieldSchema or raw JTDBaseSchema.
//
//   const UserSchema = J.object({ id: J.string(), age: J.int().optional() });
//   type User = Infer<typeof UserSchema>; // { id: string; age?: number }
export type Infer<T> = T extends FieldSchema<infer S>
  ? InferSchema<S>
  : T extends JTDBaseSchema
    ? InferSchema<T>
    : never;

// Unwraps the inner JTDBaseSchema from a FieldSchema — used internally by J.array() and J.record().
type ExtractSchema<T> = T extends FieldSchema<infer S> ? S : never;

// =============================================================================
// SECTION: Schema DSL
// =============================================================================

// J is a fluent builder object that constructs typed FieldSchema values.
// Each method maps to one JTD schema form and returns a FieldSchema whose
// generic parameter carries enough type information for Infer<T> to produce
// the correct TypeScript type.
//
// Usage:
//   const schema = J.object({
//     name:  J.string(),
//     age:   J.int().optional(),
//     email: J.string().nullable(),
//   });
//   type T = Infer<typeof schema>; // { name: string; age?: number; email: string | null }
export const J = {
  // Scalar primitives
  string:    () => createField({ type: "string"    as const }),
  boolean:   () => createField({ type: "boolean"   as const }),
  timestamp: () => createField({ type: "timestamp" as const }),

  // Numeric types — `number` and `int` are convenient aliases for float64/int32
  number:  () => createField({ type: "float64" as const }),
  int:     () => createField({ type: "int32"   as const }),
  int8:    () => createField({ type: "int8"    as const }),
  int16:   () => createField({ type: "int16"   as const }),
  int32:   () => createField({ type: "int32"   as const }),
  uint8:   () => createField({ type: "uint8"   as const }),
  uint16:  () => createField({ type: "uint16"  as const }),
  uint32:  () => createField({ type: "uint32"  as const }),
  float32: () => createField({ type: "float32" as const }),
  float64: () => createField({ type: "float64" as const }),

  // Fixed set of string literals (JTD enum form)
  enum: <const T extends readonly string[]>(values: T) =>
    createField({ enum: values }),

  // Homogeneous array — `item` defines the element schema
  array: <T extends FieldSchema>(item: T) =>
    createField({ elements: item.schema } as { elements: ExtractSchema<T> }),

  // String-keyed map — `value` defines the value schema
  record: <T extends FieldSchema>(value: T) =>
    createField({ values: value.schema } as { values: ExtractSchema<T> }),

  // Object with named fields.
  // Fields marked with .optional() are placed under `optionalProperties`;
  // all others go under `properties`.  Both sub-objects are omitted when empty
  // to produce the most compact valid JTD schema.
  object: <T extends Record<string, FieldSchema>>(fields: T) => {
    const properties: Record<string, JTDBaseSchema> = {};
    const optionalProperties: Record<string, JTDBaseSchema> = {};

    for (const [key, field] of Object.entries(fields)) {
      if (field[OPTIONAL]) {
        optionalProperties[key] = field.schema;
      } else {
        properties[key] = field.schema;
      }
    }

    const schema: JTDBaseSchema = {};
    if (Object.keys(properties).length > 0) {
      (schema as any).properties = properties;
    }
    if (Object.keys(optionalProperties).length > 0) {
      (schema as any).optionalProperties = optionalProperties;
    }

    type ResultSchema = {
      properties: { [K in RequiredKeys<T>]: ExtractSchema<T[K]> };
      optionalProperties: { [K in OptionalKeys<T>]: ExtractSchema<T[K]> };
    };

    const result = createField(schema as ResultSchema);

    // The `__fields` phantom property preserves the original field map in the
    // type so downstream utilities can inspect individual field schemas if needed.
    return result as typeof result & { __fields: T };
  },
};

// =============================================================================
// SECTION: Validation Engine
// =============================================================================

// Single shared Ajv instance — AJV compiles schemas to optimized validator
// functions; reusing one instance avoids redundant compilation work.
const ajv = new Ajv();

// WeakMap-based cache so compiled validators are GC'd together with their
// schema objects.  Keyed on the raw schema object reference (identity).
const validatorCache = new WeakMap<object, ValidateFunction>();

function getOrCompileValidator(schema: object): ValidateFunction {
  let validator = validatorCache.get(schema);
  if (!validator) {
    validator = ajv.compile(schema);
    validatorCache.set(schema, validator);
  }
  return validator;
}

// Runs the compiled validator against `data`.
// On failure, collects all AJV error messages into a single string and throws
// RavenError.ERR_VALIDATION so the framework can return a structured 400 response.
// `source` ("body", "query", etc.) is included in the error message for clarity.
function validateAndReturn<T>(
  data: unknown,
  schema: FieldSchema,
  source: string
): T {
  const validator = getOrCompileValidator(schema.schema);
  if (!validator(data)) {
    const errors = validator.errors ?? [];
    const message = errors
      .map((e) => `${e.instancePath || "/"}: ${e.message || "invalid"}`)
      .join("; ");
    throw RavenError.ERR_VALIDATION(message || `Invalid ${source}`);
  }
  return data as T;
}

// =============================================================================
// SECTION: Request Validation Helpers
// =============================================================================

// useBody / useQuery / useParams / useHeaders are thin wrappers that:
//   1. Read the corresponding pre-populated RequestState (throws if not set)
//   2. Validate the raw value against the provided FieldSchema
//   3. Return the typed result — no manual casting required at the call site
//
// Call these at the top of a route handler or inside a beforeHandle hook.
// They are synchronous and safe to call multiple times (validator is cached).
//
// Example:
//   app.post("/users", () => {
//     const body = useBody(J.object({ name: J.string(), age: J.int() }));
//     return Response.json({ created: body.name });
//   });

export function useBody<T extends FieldSchema>(schema: T): Infer<T> {
  const data = BodyState.getOrFailed();
  return validateAndReturn<Infer<T>>(data, schema, "body");
}

export function useQuery<T extends FieldSchema>(schema: T): Infer<T> {
  const data = QueryState.getOrFailed();
  return validateAndReturn<Infer<T>>(data, schema, "query");
}

export function useParams<T extends FieldSchema>(schema: T): Infer<T> {
  const data = ParamsState.getOrFailed();
  return validateAndReturn<Infer<T>>(data, schema, "params");
}

export function useHeaders<T extends FieldSchema>(schema: T): Infer<T> {
  const data = HeadersState.getOrFailed();
  return validateAndReturn<Infer<T>>(data, schema, "headers");
}
