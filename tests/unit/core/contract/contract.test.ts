import { describe, expect, it, mock } from "bun:test";
import {
  Raven,
  defineContract,
  materializeContractSchemas,
  registerContractRoute,
  withSchema,
  type CombinedSchemaV1,
  type InferContractBodyInput,
  type InferContractHeadersInput,
  type InferContractParamsInput,
  type InferContractQueryInput,
  type InferContractResponseOutput,
} from "../../../../packages/core";
import { z } from "zod";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const transformedContract = defineContract({
  method: "POST",
  path: "/orders",
  schemas: {
    body: z.object({
      page: z.string().transform((value) => Number(value)),
    }),
    response: z.object({
      page: z.string().transform((value) => Number(value)),
    }),
  },
});

const transformedBodyInputContract = defineContract({
  method: "POST",
  path: "/scalar-body",
  schemas: {
    body: z.string().transform((value) => Number(value)),
  },
});

const defaultBodyContract = defineContract({
  method: "POST",
  path: "/defaults",
  schemas: {
    body: z.string().default("fallback"),
  },
});

const queryContract = defineContract({
  method: "GET",
  path: "/search",
  schemas: {
    query: z.string().transform((value) => Number(value)),
  },
});

const paramsContract = defineContract({
  method: "GET",
  path: "/params",
  schemas: {
    params: z.string().transform((value) => Number(value)),
  },
});

const headersContract = defineContract({
  method: "GET",
  path: "/headers",
  schemas: {
    headers: z.string().transform((value) => value.toUpperCase()),
  },
});

const responseContract = defineContract({
  method: "GET",
  path: "/response",
  schemas: {
    response: z.string().transform((value) => Number(value)),
  },
});

type _bodyUsesSchemaInput = Expect<
  Equal<InferContractBodyInput<typeof transformedBodyInputContract>, string>
>;
type _defaultBodyUsesSchemaInput = Expect<
  Equal<InferContractBodyInput<typeof defaultBodyContract>, string | undefined>
>;
type _queryUsesSchemaInput = Expect<Equal<InferContractQueryInput<typeof queryContract>, string>>;
type _paramsUseSchemaInput = Expect<Equal<InferContractParamsInput<typeof paramsContract>, string>>;
type _headersUseSchemaInput = Expect<
  Equal<InferContractHeadersInput<typeof headersContract>, string>
>;
type _responseUsesSchemaOutput = Expect<
  Equal<InferContractResponseOutput<typeof responseContract>, number>
>;

const requestSerializableSchema = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (value: unknown) =>
      typeof value === "string" ? { value: value.length } : { issues: [{ message: "invalid" }] },
    jsonSchema: {
      input: () => ({ type: "string" }),
      output: () => ({ type: "number" }),
    },
  },
} as CombinedSchemaV1<string, number>;

const responseSerializableSchema = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (value: unknown) =>
      typeof value === "string" ? { value: Number(value) } : { issues: [{ message: "invalid" }] },
    jsonSchema: {
      input: () => ({ type: "string" }),
      output: () => ({ type: "number" }),
    },
  },
} as CombinedSchemaV1<string, number>;

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

describe("defineContract", () => {
  it("should preserve literal method and path values", () => {
    expect(transformedContract.method).toBe("POST");
    expect(transformedContract.path).toBe("/orders");
  });

  it("should materialize request schemas from input and response schemas from output", () => {
    const materialized = materializeContractSchemas(
      {
        body: requestSerializableSchema,
        response: responseSerializableSchema,
      },
      { target: "draft-2020-12" },
    );

    expect(materialized.body).toEqual({ type: "string" });
    expect(materialized.response).toEqual({ type: "number" });
  });

  it("should fail serialization for runtime-only schemas without affecting runtime validation", async () => {
    expect(() =>
      materializeContractSchemas(
        {
          body: runtimeOnlySchema,
        },
        { target: "draft-2020-12" },
      ),
    ).toThrow("does not implement StandardJSONSchemaV1");

    const app = new Raven();
    const handler = withSchema(
      {
        body: runtimeOnlySchema,
      },
      async (ctx) => Response.json({ value: ctx.body }),
    );

    app.post("/runtime-only", handler);

    const response = await (
      await app.ready()
    )(
      new Request("http://localhost/runtime-only", {
        method: "POST",
        body: JSON.stringify("hello"),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ value: "HELLO" });
  });
});

describe("registerContractRoute", () => {
  it("should dispatch to the app method that matches the contract method", () => {
    const app = {
      get: mock(() => app),
      post: mock(() => app),
      put: mock(() => app),
      delete: mock(() => app),
      patch: mock(() => app),
    };

    const handler = withSchema({}, async () => new Response("ok"));
    const contract = defineContract({
      method: "PATCH",
      path: "/orders/:id",
      schemas: {},
    });

    const returnedApp = registerContractRoute(app, contract, handler);

    expect(returnedApp).toBe(app);
    expect(app.patch).toHaveBeenCalledWith("/orders/:id", handler);
    expect(app.get).not.toHaveBeenCalled();
    expect(app.post).not.toHaveBeenCalled();
    expect(app.put).not.toHaveBeenCalled();
    expect(app.delete).not.toHaveBeenCalled();
  });

  it("should preserve request parsing and response serialization when registering schema-aware handlers", async () => {
    const app = new Raven();
    const businessHandler = mock(async (ctx) => ({
      page: String(ctx.body.page),
    }));
    const handler = withSchema(transformedContract.schemas, businessHandler);

    registerContractRoute(app, transformedContract, handler);

    const response = await (
      await app.ready()
    )(
      new Request("http://localhost/orders", {
        method: "POST",
        body: JSON.stringify({ page: "7" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ page: 7 });
    expect(businessHandler).toHaveBeenCalled();
  });

  it("should preserve response validation fallback hooks when the response schema mismatches", async () => {
    const app = new Raven();
    let validationHookCalled = false;
    const fallbackContract = defineContract({
      method: "GET",
      path: "/fallback",
      schemas: {
        response: z.object({
          page: z.string().transform((value) => Number(value)),
        }),
      },
    });

    app.onResponseValidationError(() => {
      validationHookCalled = true;
    });

    registerContractRoute(
      app,
      fallbackContract,
      withSchema(fallbackContract.schemas, async () => ({ page: 9 }) as any),
    );

    const response = await (await app.ready())(new Request("http://localhost/fallback"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ page: 9 });
    expect(validationHookCalled).toBe(true);
  });
});
