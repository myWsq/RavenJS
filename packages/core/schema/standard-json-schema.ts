import type { StandardSchemaV1 } from "./standard-schema.ts";

/** The Standard Typed interface. This is a base type extended by other specs. */
export interface StandardTypedV1<Input = unknown, Output = Input> {
  /** The Standard properties. */
  readonly "~standard": StandardTypedV1.Props<Input, Output>;
}

export declare namespace StandardTypedV1 {
  /** The Standard Typed properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1;
    /** The vendor name of the schema library. */
    readonly vendor: string;
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined;
  }

  /** The Standard Typed types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input;
    /** The output type of the schema. */
    readonly output: Output;
  }

  /** Infers the input type of a Standard Typed. */
  export type InferInput<Schema extends StandardTypedV1> = NonNullable<
    Schema["~standard"]["types"]
  >["input"];

  /** Infers the output type of a Standard Typed. */
  export type InferOutput<Schema extends StandardTypedV1> = NonNullable<
    Schema["~standard"]["types"]
  >["output"];
}

/** The Standard JSON Schema interface. */
export interface StandardJSONSchemaV1<Input = unknown, Output = Input> {
  /** The Standard JSON Schema properties. */
  readonly "~standard": StandardJSONSchemaV1.Props<Input, Output>;
}

export declare namespace StandardJSONSchemaV1 {
  /** The Standard JSON Schema properties interface. */
  export interface Props<Input = unknown, Output = Input> extends StandardTypedV1.Props<
    Input,
    Output
  > {
    /** Methods for generating the input/output JSON Schema. */
    readonly jsonSchema: StandardJSONSchemaV1.Converter;
  }

  /** The Standard JSON Schema converter interface. */
  export interface Converter {
    /** Converts the input type to JSON Schema. May throw if conversion is not supported. */
    readonly input: (options: StandardJSONSchemaV1.Options) => Record<string, unknown>;
    /** Converts the output type to JSON Schema. May throw if conversion is not supported. */
    readonly output: (options: StandardJSONSchemaV1.Options) => Record<string, unknown>;
  }

  /**
   * The target version of the generated JSON Schema.
   *
   * `openapi-3.0` is a best-effort target for OpenAPI 3.0 schema objects.
   */
  export type Target = "draft-2020-12" | "draft-07" | "openapi-3.0" | ({} & string);

  /** The options for the input/output methods. */
  export interface Options {
    /** Specifies the target version of the generated JSON Schema. */
    readonly target: Target;

    /** Explicit support for additional vendor-specific parameters, if needed. */
    readonly libraryOptions?: Record<string, unknown> | undefined;
  }

  /** The Standard types interface. */
  export interface Types<Input = unknown, Output = Input> extends StandardTypedV1.Types<
    Input,
    Output
  > {}

  /** Infers the input type of a Standard JSON Schema. */
  export type InferInput<Schema extends StandardTypedV1> = StandardTypedV1.InferInput<Schema>;

  /** Infers the output type of a Standard JSON Schema. */
  export type InferOutput<Schema extends StandardTypedV1> = StandardTypedV1.InferOutput<Schema>;
}

export type CombinedSchemaV1<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output> &
  StandardJSONSchemaV1<Input, Output>;

export type JsonSchemaDirection = "input" | "output";

export function isStandardJSONSchema(value: unknown): value is StandardJSONSchemaV1<any, any> {
  const maybeStandard = (value as { "~standard"?: StandardJSONSchemaV1["~standard"] } | null)?.[
    "~standard"
  ];

  return (
    typeof value === "object" &&
    value !== null &&
    typeof maybeStandard?.jsonSchema?.input === "function" &&
    typeof maybeStandard?.jsonSchema?.output === "function"
  );
}

export function materializeStandardJSONSchema(
  schema: StandardJSONSchemaV1<any, any>,
  direction: JsonSchemaDirection,
  options: StandardJSONSchemaV1.Options,
): Record<string, unknown> {
  return direction === "input"
    ? schema["~standard"].jsonSchema.input(options)
    : schema["~standard"].jsonSchema.output(options);
}
