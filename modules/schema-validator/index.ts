import { BodyState, QueryState, ParamsState, HeadersState } from "@raven.js/core";
import type { StandardSchemaV1 } from "./standard-schema";

export interface Context<
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

export type SchemaHandler<B, Q, P, H> = (ctx: Context<B, Q, P, H>) => Response | Promise<Response>;

export type ValidationSource = "body" | "query" | "params" | "headers";

export class ValidationError extends Error {
  public readonly bodyIssues?: readonly StandardSchemaV1.Issue[];
  public readonly queryIssues?: readonly StandardSchemaV1.Issue[];
  public readonly paramsIssues?: readonly StandardSchemaV1.Issue[];
  public readonly headersIssues?: readonly StandardSchemaV1.Issue[];

  constructor(results: {
    body?: StandardSchemaV1.FailureResult;
    query?: StandardSchemaV1.FailureResult;
    params?: StandardSchemaV1.FailureResult;
    headers?: StandardSchemaV1.FailureResult;
  }) {
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

async function validateSchema<T>(
  schema: StandardSchemaV1<unknown, T> | undefined,
  value: unknown,
): Promise<StandardSchemaV1.Result<T> | undefined> {
  if (!schema) {
    return undefined;
  }

  return schema["~standard"].validate(value);
}

export function isValidationError(value: unknown): value is ValidationError {
  return value instanceof ValidationError;
}

export function withSchema<B, Q, P, H>(
  schemas: Schemas<B, Q, P, H>,
  handler: SchemaHandler<B, Q, P, H>,
): () => Promise<Response> {
  return async () => {
    const body = BodyState.get();
    const query = QueryState.get() ?? {};
    const params = ParamsState.get() ?? {};
    const headers = HeadersState.get() ?? {};

    const [bodyResult, queryResult, paramsResult, headersResult] = await Promise.all([
      validateSchema(schemas.body, body),
      validateSchema(schemas.query, query),
      validateSchema(schemas.params, params),
      validateSchema(schemas.headers, headers),
    ]);

    if (
      bodyResult?.issues ||
      queryResult?.issues ||
      paramsResult?.issues ||
      headersResult?.issues
    ) {
      throw new ValidationError({
        body: bodyResult?.issues ? (bodyResult as StandardSchemaV1.FailureResult) : undefined,
        query: queryResult?.issues ? (queryResult as StandardSchemaV1.FailureResult) : undefined,
        params: paramsResult?.issues ? (paramsResult as StandardSchemaV1.FailureResult) : undefined,
        headers: headersResult?.issues
          ? (headersResult as StandardSchemaV1.FailureResult)
          : undefined,
      });
    }

    const ctx: Context<B, Q, P, H> = {
      body: bodyResult ? (bodyResult as StandardSchemaV1.SuccessResult<B>).value : (body as B),
      query: queryResult ? (queryResult as StandardSchemaV1.SuccessResult<Q>).value : (query as Q),
      params: paramsResult
        ? (paramsResult as StandardSchemaV1.SuccessResult<P>).value
        : (params as P),
      headers: headersResult
        ? (headersResult as StandardSchemaV1.SuccessResult<H>).value
        : (headers as H),
    };

    return handler(ctx);
  };
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

/**
 * Returns a base class from a shape (object of Standard Schemas) for type inference only. Prefer
 * extending it so the subclass can be used as a type and extended with methods:
 *
 *   class Entity extends SchemaClass({ id: z.string(), name: z.string() }) {}
 *   const e: Entity = new Entity({ id: "1", name: "foo" });
 *
 * No runtime validation is performed. Constructor accepts input per key; instance is typed as outputs.
 *
 * @param _shape - Object of schemas (shape), e.g. { id: z.string(), price: z.number() }
 * @returns A class to extend; instances typed as { id: string, price: number, _shape }
 */
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
