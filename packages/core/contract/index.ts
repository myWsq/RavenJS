import type { StandardSchemaV1 } from "../schema/standard-schema.ts";

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

export function defineContract<
  const Method extends HttpMethod,
  const Path extends string,
  const Schemas extends ContractSchemas,
>(contract: { method: Method; path: Path; schemas: Schemas }): Contract<Method, Path, Schemas> {
  return contract;
}
