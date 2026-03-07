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
  RI = never,
  RO = RI,
> {
  body?: StandardSchemaV1<unknown, B>;
  query?: StandardSchemaV1<Record<string, string>, Q>;
  params?: StandardSchemaV1<Record<string, string>, P>;
  headers?: StandardSchemaV1<Record<string, string>, H>;
  response?: StandardSchemaV1<RI, RO>;
}

export type SchemaHandler<B, Q, P, H> = (
  ctx: SchemaContext<B, Q, P, H>,
) => Response | Promise<Response>;

type SchemaResponseHandler<B, Q, P, H, RI> = (ctx: SchemaContext<B, Q, P, H>) => RI | Promise<RI>;

type RequestSchemas<
  B = unknown,
  Q = Record<string, string>,
  P = Record<string, string>,
  H = Record<string, string>,
> = Omit<Schemas<B, Q, P, H>, "response"> & {
  response?: undefined;
};

type ResponseSchemas<
  B = unknown,
  Q = Record<string, string>,
  P = Record<string, string>,
  H = Record<string, string>,
  RI = unknown,
  RO = RI,
> = Schemas<B, Q, P, H, RI, RO> & {
  response: StandardSchemaV1<RI, RO>;
};

export type ValidationSource = "body" | "query" | "params" | "headers" | "response";

export interface SchemaAwareHandler<
  B = unknown,
  Q = Record<string, string>,
  P = Record<string, string>,
  H = Record<string, string>,
  RI = never,
  RO = RI,
> {
  readonly __ravenSchemaHandler: true;
  readonly schemas: Schemas<B, Q, P, H, RI, RO>;
  readonly handler: [RI] extends [never]
    ? SchemaHandler<B, Q, P, H>
    : SchemaResponseHandler<B, Q, P, H, RI>;
}

export type AnySchemas = Schemas<any, any, any, any, any, any>;
export type AnySchemaAwareHandler = SchemaAwareHandler<any, any, any, any, any, any>;

export function withSchema<B, Q, P, H>(
  schemas: RequestSchemas<B, Q, P, H>,
  handler: SchemaHandler<B, Q, P, H>,
): SchemaAwareHandler<B, Q, P, H>;

export function withSchema<B, Q, P, H, RI, RO>(
  schemas: ResponseSchemas<B, Q, P, H, RI, RO>,
  handler: SchemaResponseHandler<B, Q, P, H, RI>,
): SchemaAwareHandler<B, Q, P, H, RI, RO>;

export function withSchema<B, Q, P, H, RI, RO>(
  schemas: Schemas<B, Q, P, H, RI, RO>,
  handler: SchemaHandler<B, Q, P, H> | SchemaResponseHandler<B, Q, P, H, RI>,
): SchemaAwareHandler<B, Q, P, H, RI, RO> {
  return {
    __ravenSchemaHandler: true,
    schemas,
    handler: handler as SchemaAwareHandler<B, Q, P, H, RI, RO>["handler"],
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
