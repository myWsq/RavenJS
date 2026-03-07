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
