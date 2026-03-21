import type { StandardSchemaV1 } from "../schema/standard-schema.ts";
import {
  isStandardJSONSchema,
  materializeStandardJSONSchema,
  type CombinedSchemaV1,
  type StandardJSONSchemaV1,
} from "../schema/standard-json-schema.ts";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ContractSchemas {
  body?: StandardSchemaV1<any, any>;
  query?: StandardSchemaV1<any, any>;
  params?: StandardSchemaV1<any, any>;
  headers?: StandardSchemaV1<any, any>;
  response?: StandardSchemaV1<any, any>;
}

export interface Contract<
  Method extends HttpMethod = HttpMethod,
  Path extends string = string,
  Schemas extends ContractSchemas = ContractSchemas,
> {
  readonly method: Method;
  readonly path: Path;
  readonly schemas: Schemas;
}

export type AnyContract = Contract<any, string, ContractSchemas>;
export type ContractSchemaKey = keyof ContractSchemas;
export type RequestContractSchemaKey = Exclude<ContractSchemaKey, "response">;
export type SerializableContractSchema<Input = unknown, Output = Input> = CombinedSchemaV1<
  Input,
  Output
>;

export interface SerializableContractSchemas {
  body?: SerializableContractSchema<any, any>;
  query?: SerializableContractSchema<any, any>;
  params?: SerializableContractSchema<any, any>;
  headers?: SerializableContractSchema<any, any>;
  response?: SerializableContractSchema<any, any>;
}

export interface MaterializedContractSchemas {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  response?: Record<string, unknown>;
}

type InferSchemaInput<Schema, Fallback = never> =
  Schema extends StandardSchemaV1<infer Input, any> ? Input : Fallback;

type InferSchemaOutput<Schema, Fallback = never> =
  Schema extends StandardSchemaV1<any, infer Output> ? Output : Fallback;

type ContractSchema<
  TContract extends AnyContract,
  TKey extends keyof ContractSchemas,
> = TContract["schemas"][TKey];

export type InferContractBodyInput<TContract extends AnyContract> = InferSchemaInput<
  ContractSchema<TContract, "body">
>;

export type InferContractQueryInput<TContract extends AnyContract> = InferSchemaInput<
  ContractSchema<TContract, "query">
>;

export type InferContractParamsInput<TContract extends AnyContract> = InferSchemaInput<
  ContractSchema<TContract, "params">
>;

export type InferContractHeadersInput<TContract extends AnyContract> = InferSchemaInput<
  ContractSchema<TContract, "headers">
>;

export type InferContractResponseOutput<TContract extends AnyContract> = InferSchemaOutput<
  ContractSchema<TContract, "response">
>;

function getSchemaMaterializeDirection(key: ContractSchemaKey): "input" | "output" {
  return key === "response" ? "output" : "input";
}

export function isSerializableContractSchema(
  schema: unknown,
): schema is SerializableContractSchema<any, any> {
  return isStandardJSONSchema(schema);
}

export function materializeContractSchema(
  schema: StandardSchemaV1<any, any>,
  key: ContractSchemaKey,
  options: StandardJSONSchemaV1.Options,
): Record<string, unknown> {
  if (!isSerializableContractSchema(schema)) {
    throw new Error(
      `Contract schema '${key}' does not implement StandardJSONSchemaV1 and cannot be serialized`,
    );
  }

  return materializeStandardJSONSchema(schema, getSchemaMaterializeDirection(key), options);
}

export function materializeContractSchemas(
  schemas: ContractSchemas,
  options: StandardJSONSchemaV1.Options,
): MaterializedContractSchemas {
  const materialized: MaterializedContractSchemas = {};

  for (const key of ["body", "query", "params", "headers", "response"] as const) {
    const schema = schemas[key];
    if (!schema) {
      continue;
    }

    materialized[key] = materializeContractSchema(schema, key, options);
  }

  return materialized;
}

export function defineContract<
  const Method extends HttpMethod,
  const Path extends string,
  const Schemas extends ContractSchemas,
>(contract: { method: Method; path: Path; schemas: Schemas }): Contract<Method, Path, Schemas> {
  return contract;
}
