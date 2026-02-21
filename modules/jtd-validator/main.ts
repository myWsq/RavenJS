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
} from "../core";

// =============================================================================
// SECTION: JTD Schema Types
// =============================================================================

export const OPTIONAL = Symbol("optional");

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

export interface FieldSchema<T extends JTDBaseSchema = JTDBaseSchema> {
  readonly [OPTIONAL]?: true;
  readonly schema: T;
  optional(): FieldSchema<T> & { readonly [OPTIONAL]: true };
  nullable(): FieldSchema<T & { nullable: true }>;
}

// =============================================================================
// SECTION: Field Schema Factory
// =============================================================================

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
// SECTION: Type Inference
// =============================================================================

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

type InferNullable<T, Base> = T extends { nullable: true } ? Base | null : Base;

type InferFieldSchema<T> = T extends FieldSchema<infer S> ? InferSchema<S> : never;

type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends { readonly [OPTIONAL]: true } ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends { readonly [OPTIONAL]: true } ? K : never;
}[keyof T];

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

export type Infer<T> = T extends FieldSchema<infer S>
  ? InferSchema<S>
  : T extends JTDBaseSchema
    ? InferSchema<T>
    : never;

type ExtractSchema<T> = T extends FieldSchema<infer S> ? S : never;

// =============================================================================
// SECTION: Schema DSL (J object)
// =============================================================================

export const J = {
  string: () => createField({ type: "string" as const }),
  boolean: () => createField({ type: "boolean" as const }),
  number: () => createField({ type: "float64" as const }),
  int: () => createField({ type: "int32" as const }),
  int8: () => createField({ type: "int8" as const }),
  int16: () => createField({ type: "int16" as const }),
  int32: () => createField({ type: "int32" as const }),
  uint8: () => createField({ type: "uint8" as const }),
  uint16: () => createField({ type: "uint16" as const }),
  uint32: () => createField({ type: "uint32" as const }),
  float32: () => createField({ type: "float32" as const }),
  float64: () => createField({ type: "float64" as const }),
  timestamp: () => createField({ type: "timestamp" as const }),

  enum: <const T extends readonly string[]>(values: T) =>
    createField({ enum: values }),

  array: <T extends FieldSchema>(item: T) =>
    createField({ elements: item.schema } as { elements: ExtractSchema<T> }),

  record: <T extends FieldSchema>(value: T) =>
    createField({ values: value.schema } as { values: ExtractSchema<T> }),

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

    return result as typeof result & { __fields: T };
  },
};

// =============================================================================
// SECTION: Validation
// =============================================================================

const ajv = new Ajv();
const validatorCache = new WeakMap<object, ValidateFunction>();

function getOrCompileValidator(schema: object): ValidateFunction {
  let validator = validatorCache.get(schema);
  if (!validator) {
    validator = ajv.compile(schema);
    validatorCache.set(schema, validator);
  }
  return validator;
}

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
// SECTION: Validation Hooks
// =============================================================================

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
