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
  get(path: string, handler: RouteHandler): unknown;
  post(path: string, handler: RouteHandler): unknown;
  put(path: string, handler: RouteHandler): unknown;
  delete(path: string, handler: RouteHandler): unknown;
  patch(path: string, handler: RouteHandler): unknown;
}

export function registerContractRoute<TApp extends ContractRouteApp, TContract extends AnyContract>(
  app: TApp,
  contract: TContract,
  handler: ContractRouteHandler<TContract>,
): TApp {
  switch (contract.method) {
    case "GET":
      app.get(contract.path, handler);
      return app;
    case "POST":
      app.post(contract.path, handler);
      return app;
    case "PUT":
      app.put(contract.path, handler);
      return app;
    case "DELETE":
      app.delete(contract.path, handler);
      return app;
    case "PATCH":
      app.patch(contract.path, handler);
      return app;
  }

  throw new Error(`Unsupported contract method: ${contract.method}`);
}
