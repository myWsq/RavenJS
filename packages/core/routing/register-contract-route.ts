import type { AnyContract } from "../contract/index.ts";
import type { RouteHandler } from "../app/types.ts";
import type { StandardSchemaV1 } from "../schema/standard-schema.ts";
import type { SchemaAwareHandler } from "../schema/with-schema.ts";

type RequestSchemaOutput<Schema, Fallback> =
  Schema extends StandardSchemaV1<any, infer Output> ? Output : Fallback;

type ResponseSchemaInput<Schema> =
  Schema extends StandardSchemaV1<infer Input, any> ? Input : never;

type ResponseSchemaOutput<Schema> =
  Schema extends StandardSchemaV1<any, infer Output> ? Output : ResponseSchemaInput<Schema>;

type ContractRouteHandler<TContract extends AnyContract> = SchemaAwareHandler<
  RequestSchemaOutput<TContract["schemas"]["body"], unknown>,
  RequestSchemaOutput<TContract["schemas"]["query"], unknown>,
  RequestSchemaOutput<TContract["schemas"]["params"], unknown>,
  RequestSchemaOutput<TContract["schemas"]["headers"], unknown>,
  ResponseSchemaInput<TContract["schemas"]["response"]>,
  ResponseSchemaOutput<TContract["schemas"]["response"]>
>;

interface ContractRouteApp {
  registerContractRoute(contract: AnyContract, handler: RouteHandler): unknown;
}

export function registerContractRoute<TApp extends ContractRouteApp, TContract extends AnyContract>(
  app: TApp,
  contract: TContract,
  handler: ContractRouteHandler<TContract>,
): TApp {
  app.registerContractRoute(contract, handler);
  return app;
}
