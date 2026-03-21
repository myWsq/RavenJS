import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  Raven,
  defineContract,
  definePlugin,
  registerContractRoute,
  withSchema,
} from "../../../../packages/core";
import { z } from "zod";

const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.warn = originalConsoleWarn;
});

afterEach(() => {
  console.warn = originalConsoleWarn;
});

describe("Raven OpenAPI export", () => {
  it("should expose an OpenAPI document at the default path", async () => {
    const app = new Raven();
    const contract = defineContract({
      method: "POST",
      path: "/orders/:orderId",
      schemas: {
        body: z.object({
          quantity: z.number(),
        }),
        params: z.object({
          orderId: z.string(),
        }),
        response: z.object({
          id: z.string(),
        }),
      },
    });

    registerContractRoute(
      app,
      contract,
      withSchema(contract.schemas, async () => ({
        id: ctxId("order"),
      })),
    );
    app.exportOpenAPI();

    const response = await (await app.ready())(new Request("http://localhost/openapi.json"));
    const document = (await response.json()) as {
      info: { title: string; version: string };
      paths: Record<string, Record<string, { parameters?: unknown[]; requestBody?: unknown }>>;
      components: { schemas: Record<string, unknown> };
    };

    expect(response.status).toBe(200);
    expect(document.info).toEqual({
      title: "Raven API",
      version: "1.0.0",
    });
    expect(document.paths["/orders/{orderId}"]?.post).toBeTruthy();
    expect(document.paths["/orders/{orderId}"]?.post?.parameters).toBeTruthy();
    expect(document.paths["/orders/{orderId}"]?.post?.requestBody).toBeTruthy();
    expect(Object.keys(document.components.schemas)).not.toHaveLength(0);
  });

  it("should support a custom OpenAPI path and info", async () => {
    const app = new Raven();
    const contract = defineContract({
      method: "GET",
      path: "/orders",
      schemas: {
        response: z.object({
          count: z.number(),
        }),
      },
    });

    registerContractRoute(
      app,
      contract,
      withSchema(contract.schemas, async () => ({
        count: 1,
      })),
    );
    app.exportOpenAPI({
      path: "/internal/spec.json",
      info: {
        title: "Orders API",
        version: "2.1.0",
      },
    });

    const response = await (await app.ready())(new Request("http://localhost/internal/spec.json"));
    const document = (await response.json()) as {
      info: { title: string; version: string };
    };

    expect(response.status).toBe(200);
    expect(document.info).toEqual({
      title: "Orders API",
      version: "2.1.0",
    });
  });

  it("should include contract routes registered during plugin load", async () => {
    const app = new Raven();
    const contract = defineContract({
      method: "GET",
      path: "/plugin-orders",
      schemas: {
        response: z.object({
          ok: z.boolean(),
        }),
      },
    });

    app.register(
      definePlugin({
        name: "contract-plugin",
        load(app) {
          registerContractRoute(
            app,
            contract,
            withSchema(contract.schemas, async () => ({
              ok: true,
            })),
          );
        },
      }),
    );
    app.exportOpenAPI();

    const response = await (await app.ready())(new Request("http://localhost/openapi.json"));
    const document = (await response.json()) as {
      paths: Record<string, Record<string, unknown>>;
    };

    expect(document.paths["/plugin-orders"]?.get).toBeTruthy();
  });

  it("should warn and skip operations that cannot be materialized to OpenAPI", async () => {
    const app = new Raven();
    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args.join(" "));
    };

    const runtimeOnlySchema = {
      "~standard": {
        version: 1 as const,
        vendor: "runtime-only",
        validate: (value: unknown) =>
          typeof value === "string"
            ? { value: value.toUpperCase() }
            : { issues: [{ message: "invalid" }] },
      },
    };
    const contract = defineContract({
      method: "POST",
      path: "/runtime-only",
      schemas: {
        body: runtimeOnlySchema,
      },
    });

    registerContractRoute(
      app,
      contract,
      withSchema(contract.schemas, async () => Response.json({ ok: true })),
    );
    app.exportOpenAPI();

    const response = await (await app.ready())(new Request("http://localhost/openapi.json"));
    const document = (await response.json()) as {
      paths: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(document.paths["/runtime-only"]).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Skipped POST /runtime-only");
    expect(warnings[0]).toContain("does not implement StandardJSONSchemaV1");
  });
});

function ctxId(prefix: string) {
  return `${prefix}_1`;
}
