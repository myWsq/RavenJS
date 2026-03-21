import {
  materializeContractSchema,
  type AnyContract,
  type ContractSchemaKey,
} from "../contract/index.ts";
import type { RegisteredRoute } from "./route-manifest.ts";

interface OpenAPIParameter {
  name: string;
  in: "query" | "path" | "header";
  required: boolean;
  schema: Record<string, unknown>;
}

export interface OpenAPIInfo {
  title: string;
  version: string;
}

export interface OpenAPIExportOptions {
  path?: string;
  info?: Partial<OpenAPIInfo>;
}

export interface OpenAPIWarning {
  method: string;
  path: string;
  reason: string;
}

export interface OpenAPIDocument {
  openapi: "3.0.3";
  info: OpenAPIInfo;
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, Record<string, unknown>>;
  };
}

export const DEFAULT_OPENAPI_PATH = "/openapi.json";
export const DEFAULT_OPENAPI_INFO: OpenAPIInfo = {
  title: "Raven API",
  version: "1.0.0",
};

function toOpenAPIPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function makeOpenAPISchemaId(contract: AnyContract, key: ContractSchemaKey): string {
  return `${contract.method}_${contract.path}_${key}`.replace(/[^A-Za-z0-9_#.:-]/g, "_");
}

function extractOpenAPIParameters(
  schema: Record<string, unknown>,
  location: OpenAPIParameter["in"],
): OpenAPIParameter[] {
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    throw new Error(
      `OpenAPI ${location} schemas must materialize to an object schema with properties`,
    );
  }

  const required = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((value): value is string => typeof value === "string")
      : [],
  );

  return Object.entries(properties).map(([name, propertySchema]) => {
    if (
      typeof propertySchema !== "object" ||
      propertySchema === null ||
      Array.isArray(propertySchema)
    ) {
      throw new Error(`OpenAPI ${location} property '${name}' must materialize to a schema object`);
    }

    return {
      name,
      in: location,
      required: location === "path" ? true : required.has(name),
      schema: propertySchema as Record<string, unknown>,
    };
  });
}

function buildOperationDocument(contract: AnyContract) {
  const materializedSchemas: Partial<Record<ContractSchemaKey, Record<string, unknown>>> = {};

  for (const key of ["body", "query", "params", "headers", "response"] as const) {
    const schema = contract.schemas[key];
    if (!schema) {
      continue;
    }

    materializedSchemas[key] = materializeContractSchema(schema, key, { target: "openapi-3.0" });
  }

  return materializedSchemas;
}

function formatWarning(contract: AnyContract, error: unknown): OpenAPIWarning {
  return {
    method: contract.method,
    path: contract.path,
    reason: error instanceof Error ? error.message : String(error),
  };
}

export function buildOpenAPIDocument(
  routes: readonly RegisteredRoute[],
  options: OpenAPIExportOptions = {},
): { document: OpenAPIDocument; warnings: OpenAPIWarning[] } {
  const info: OpenAPIInfo = {
    title: options.info?.title ?? DEFAULT_OPENAPI_INFO.title,
    version: options.info?.version ?? DEFAULT_OPENAPI_INFO.version,
  };
  const paths: Record<string, Record<string, unknown>> = {};
  const componentSchemas: Record<string, Record<string, unknown>> = {};
  const warnings: OpenAPIWarning[] = [];

  for (const route of routes) {
    const contract = route.contract;
    if (!contract) {
      continue;
    }

    try {
      const materializedSchemas = buildOperationDocument(contract);
      const operation: Record<string, unknown> = {
        responses: {
          "200": contract.schemas.response
            ? {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      $ref: `#/components/schemas/${makeOpenAPISchemaId(contract, "response")}`,
                    },
                  },
                },
              }
            : {
                description: "Success",
              },
        },
      };
      const parameters: OpenAPIParameter[] = [];

      if (materializedSchemas.query) {
        const schemaId = makeOpenAPISchemaId(contract, "query");
        componentSchemas[schemaId] = materializedSchemas.query;
        parameters.push(...extractOpenAPIParameters(materializedSchemas.query, "query"));
      }

      if (materializedSchemas.params) {
        const schemaId = makeOpenAPISchemaId(contract, "params");
        componentSchemas[schemaId] = materializedSchemas.params;
        parameters.push(...extractOpenAPIParameters(materializedSchemas.params, "path"));
      }

      if (materializedSchemas.headers) {
        const schemaId = makeOpenAPISchemaId(contract, "headers");
        componentSchemas[schemaId] = materializedSchemas.headers;
        parameters.push(...extractOpenAPIParameters(materializedSchemas.headers, "header"));
      }

      if (parameters.length > 0) {
        operation.parameters = parameters;
      }

      if (materializedSchemas.body) {
        const schemaId = makeOpenAPISchemaId(contract, "body");
        componentSchemas[schemaId] = materializedSchemas.body;
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: `#/components/schemas/${schemaId}`,
              },
            },
          },
        };
      }

      if (materializedSchemas.response) {
        const schemaId = makeOpenAPISchemaId(contract, "response");
        componentSchemas[schemaId] = materializedSchemas.response;
      }

      const openAPIPath = toOpenAPIPath(contract.path);
      paths[openAPIPath] = {
        ...(paths[openAPIPath] ?? {}),
        [contract.method.toLowerCase()]: operation,
      };
    } catch (error) {
      warnings.push(formatWarning(contract, error));
    }
  }

  return {
    document: {
      openapi: "3.0.3",
      info,
      paths,
      components: {
        schemas: componentSchemas,
      },
    },
    warnings,
  };
}
