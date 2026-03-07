import type { StandardSchemaV1 } from "./standard-schema.ts";

export interface SchemaContext<
  B = unknown,
  Q = Record<string, string>,
  P = Record<string, string>,
  H = Record<string, string>,
> {
  body: B;
  query: Q;
  params: P;
  headers: H;
}

export interface Schemas<
  B = unknown,
  Q = Record<string, string>,
  P = Record<string, string>,
  H = Record<string, string>,
> {
  body?: StandardSchemaV1<unknown, B>;
  query?: StandardSchemaV1<Record<string, string>, Q>;
  params?: StandardSchemaV1<Record<string, string>, P>;
  headers?: StandardSchemaV1<Record<string, string>, H>;
}

export type SchemaHandler<B, Q, P, H> = (
  ctx: SchemaContext<B, Q, P, H>,
) => Response | Promise<Response>;

export type ValidationSource = "body" | "query" | "params" | "headers";

export interface SchemaAwareHandler<
  B = unknown,
  Q = Record<string, string>,
  P = Record<string, string>,
  H = Record<string, string>,
> {
  readonly __ravenSchemaHandler: true;
  readonly schemas: Schemas<B, Q, P, H>;
  readonly handler: SchemaHandler<B, Q, P, H>;
}

export type AnySchemas = Schemas<any, any, any, any>;
export type AnySchemaAwareHandler = SchemaAwareHandler<any, any, any, any>;

type ValidationResults = {
  body?: StandardSchemaV1.FailureResult;
  query?: StandardSchemaV1.FailureResult;
  params?: StandardSchemaV1.FailureResult;
  headers?: StandardSchemaV1.FailureResult;
};

type ValidationInput = {
  body: unknown;
  query: Record<string, string>;
  params: Record<string, string>;
  headers: Record<string, string>;
};

type ValidationOutput = {
  body: unknown;
  query: unknown;
  params: unknown;
  headers: unknown;
};

export class ValidationError extends Error {
  public readonly bodyIssues?: readonly StandardSchemaV1.Issue[];
  public readonly queryIssues?: readonly StandardSchemaV1.Issue[];
  public readonly paramsIssues?: readonly StandardSchemaV1.Issue[];
  public readonly headersIssues?: readonly StandardSchemaV1.Issue[];

  constructor(results: ValidationResults) {
    const allIssues = [
      ...(results.body?.issues ?? []),
      ...(results.query?.issues ?? []),
      ...(results.params?.issues ?? []),
      ...(results.headers?.issues ?? []),
    ];
    const message = allIssues.map((issue) => issue.message).join(", ");
    super(message);
    this.name = "ValidationError";
    this.bodyIssues = results.body?.issues;
    this.queryIssues = results.query?.issues;
    this.paramsIssues = results.params?.issues;
    this.headersIssues = results.headers?.issues;
  }
}

export function isValidationError(value: unknown): value is ValidationError {
  return value instanceof ValidationError;
}

function isFailureResult<T>(
  result: StandardSchemaV1.Result<T> | undefined,
): result is StandardSchemaV1.FailureResult {
  return Array.isArray(result?.issues);
}

async function validateSchema<T>(
  schema: StandardSchemaV1<unknown, T> | undefined,
  value: unknown,
): Promise<StandardSchemaV1.Result<T> | undefined> {
  if (!schema) {
    return undefined;
  }

  return schema["~standard"].validate(value);
}

export async function validateRequestSchemas(
  schemas: AnySchemas | undefined,
  input: ValidationInput,
): Promise<ValidationOutput> {
  const [bodyResult, queryResult, paramsResult, headersResult] = await Promise.all([
    validateSchema(schemas?.body, input.body),
    validateSchema(schemas?.query, input.query),
    validateSchema(schemas?.params, input.params),
    validateSchema(schemas?.headers, input.headers),
  ]);

  if (
    isFailureResult(bodyResult) ||
    isFailureResult(queryResult) ||
    isFailureResult(paramsResult) ||
    isFailureResult(headersResult)
  ) {
    throw new ValidationError({
      body: isFailureResult(bodyResult) ? bodyResult : undefined,
      query: isFailureResult(queryResult) ? queryResult : undefined,
      params: isFailureResult(paramsResult) ? paramsResult : undefined,
      headers: isFailureResult(headersResult) ? headersResult : undefined,
    });
  }

  return {
    body: bodyResult ? bodyResult.value : input.body,
    query: queryResult ? queryResult.value : input.query,
    params: paramsResult ? paramsResult.value : input.params,
    headers: headersResult ? headersResult.value : input.headers,
  };
}

export function withSchema<B, Q, P, H>(
  schemas: Schemas<B, Q, P, H>,
  handler: SchemaHandler<B, Q, P, H>,
): SchemaAwareHandler<B, Q, P, H> {
  return {
    __ravenSchemaHandler: true,
    schemas,
    handler,
  };
}

export function isSchemaAwareHandler(value: unknown): value is AnySchemaAwareHandler {
  return (
    typeof value === "object" &&
    value !== null &&
    "__ravenSchemaHandler" in value &&
    (value as { __ravenSchemaHandler?: boolean }).__ravenSchemaHandler === true
  );
}

/** Infers input type for an object of schemas: { id: SchemaA, price: SchemaB } -> { id: InputA, price: InputB }. */
type InferInputObj<T extends Record<string, StandardSchemaV1>> = {
  [K in keyof T]: StandardSchemaV1.InferInput<T[K]>;
};

/** Infers output type for an object of schemas: { id: SchemaA, price: SchemaB } -> { id: OutputA, price: OutputB }. */
type InferOutputObj<T extends Record<string, StandardSchemaV1>> = {
  [K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
};

type SchemaClassCtor<T extends Record<string, StandardSchemaV1>> = {
  new (input: InferInputObj<T>): InferOutputObj<T> & { _shape: T };
  _shape: T;
};

export function SchemaClass<T extends Record<string, StandardSchemaV1>>(
  _shape: T,
): SchemaClassCtor<T> {
  const SchemaClass = class {
    static _shape: T = _shape;
    declare _shape: T;

    constructor(input: InferInputObj<T>) {
      Object.assign(this, input);
      this._shape = _shape;
    }
  };

  return SchemaClass as SchemaClassCtor<T>;
}
