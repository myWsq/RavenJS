import { describe, expect, it } from "bun:test";
import { QueryState, Raven, isValidationError, withSchema } from "../../../../packages/core";
import { z } from "zod";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const typedResponseHandler = withSchema(
  {
    response: z.object({
      page: z.string().transform((value) => Number(value)),
    }),
  },
  async () => ({ page: "1" }),
);

type TypedResponseInput = Awaited<ReturnType<typeof typedResponseHandler.handler>>;
type _typedResponseUsesSchemaInput = Expect<Equal<TypedResponseInput, { page: string }>>;

const typedResponselessHandler = withSchema({}, async () => new Response("OK"));

type TypedResponselessReturn = Awaited<ReturnType<typeof typedResponselessHandler.handler>>;
type _responselessHandlerStillReturnsResponse = Expect<Equal<TypedResponselessReturn, Response>>;

// @ts-expect-error response DTO requires a declared response schema
withSchema({}, async () => ({ ok: true }));

describe("withSchema", () => {
  it("should pass validated body to handler", async () => {
    const bodySchema = z.object({
      name: z.string(),
    });

    const app = new Raven();
    app.post(
      "/test",
      withSchema({ body: bodySchema }, async (ctx) => {
        return new Response(JSON.stringify(ctx.body), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const response = await (
      await app.ready()
    )(
      new Request("http://localhost/test", {
        method: "POST",
        body: JSON.stringify({ name: "test" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ name: "test" });
  });

  it("should throw ValidationError when body validation fails", async () => {
    const bodySchema = z.object({
      name: z.string(),
    });

    let capturedError: Error | undefined;
    const app = new Raven();
    app.post(
      "/test",
      withSchema({ body: bodySchema }, async () => new Response("OK")),
    );
    app.onError((err) => {
      capturedError = err;
      return new Response("Error", { status: 400 });
    });

    await (
      await app.ready()
    )(
      new Request("http://localhost/test", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(isValidationError(capturedError!)).toBe(true);
    expect((capturedError as ReturnType<typeof Object.assign>).bodyIssues).toBeDefined();
  });

  it("should pass validated query to handler", async () => {
    const querySchema = z.object({
      page: z.string(),
    });

    const app = new Raven();
    app.get(
      "/test",
      withSchema({ query: querySchema }, async (ctx) => {
        return new Response(JSON.stringify(ctx.query), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const response = await (await app.ready())(new Request("http://localhost/test?page=1"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ page: "1" });
  });

  it("should write validated query output back to QueryState before beforeHandle", async () => {
    const querySchema = z.object({
      page: z.string().transform((value) => Number(value)),
    });

    let beforeHandlePage: number | undefined;
    const app = new Raven();
    app.beforeHandle(() => {
      beforeHandlePage = (QueryState.getOrFailed() as unknown as { page: number }).page;
    });
    app.get(
      "/test",
      withSchema({ query: querySchema }, async (ctx) => {
        return Response.json({
          beforeHandlePage,
          handlerPage: ctx.query.page,
        });
      }),
    );

    const response = await (await app.ready())(new Request("http://localhost/test?page=7"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      beforeHandlePage: 7,
      handlerPage: 7,
    });
  });

  it("should throw ValidationError when query validation fails", async () => {
    const querySchema = z.object({
      page: z.string(),
    });

    let capturedError: Error | undefined;
    const app = new Raven();
    app.get(
      "/test",
      withSchema({ query: querySchema }, async () => new Response("OK")),
    );
    app.onError((err) => {
      capturedError = err;
      return new Response("Error", { status: 400 });
    });

    await (
      await app.ready()
    )(new Request("http://localhost/test"));

    expect(isValidationError(capturedError!)).toBe(true);
    expect((capturedError as ReturnType<typeof Object.assign>).queryIssues).toBeDefined();
  });

  it("should pass validated params to handler", async () => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const app = new Raven();
    app.get(
      "/test/:id",
      withSchema({ params: paramsSchema }, async (ctx) => {
        return new Response(JSON.stringify(ctx.params), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const response = await (await app.ready())(new Request("http://localhost/test/123"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: "123" });
  });

  it("should throw ValidationError when params validation fails", async () => {
    const paramsSchema = z.object({
      id: z.string().min(5),
    });

    let capturedError: Error | undefined;
    const app = new Raven();
    app.get(
      "/test/:id",
      withSchema({ params: paramsSchema }, async () => new Response("OK")),
    );
    app.onError((err) => {
      capturedError = err;
      return new Response("Error", { status: 400 });
    });

    await (
      await app.ready()
    )(new Request("http://localhost/test/ab"));

    expect(isValidationError(capturedError!)).toBe(true);
    expect((capturedError as ReturnType<typeof Object.assign>).paramsIssues).toBeDefined();
  });

  it("should pass validated headers to handler", async () => {
    const headersSchema = z.object({
      authorization: z.string(),
    });

    const app = new Raven();
    app.get(
      "/test",
      withSchema({ headers: headersSchema }, async (ctx) => {
        return new Response(JSON.stringify(ctx.headers), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const response = await (
      await app.ready()
    )(
      new Request("http://localhost/test", {
        headers: { authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.authorization).toBe("Bearer token");
  });

  it("should throw ValidationError when headers validation fails", async () => {
    const headersSchema = z.object({
      authorization: z.string(),
    });

    let capturedError: Error | undefined;
    const app = new Raven();
    app.get(
      "/test",
      withSchema({ headers: headersSchema }, async () => new Response("OK")),
    );
    app.onError((err) => {
      capturedError = err;
      return new Response("Error", { status: 400 });
    });

    await (
      await app.ready()
    )(new Request("http://localhost/test"));

    expect(isValidationError(capturedError!)).toBe(true);
    expect((capturedError as ReturnType<typeof Object.assign>).headersIssues).toBeDefined();
  });

  it("should validate all parameters when all schemas provided", async () => {
    const bodySchema = z.object({
      name: z.string(),
    });
    const querySchema = z.object({
      page: z.string(),
    });
    const paramsSchema = z.object({
      id: z.string(),
    });
    const headersSchema = z.object({
      auth: z.string(),
    });

    const app = new Raven();
    app.post(
      "/test/:id",
      withSchema(
        {
          body: bodySchema,
          query: querySchema,
          params: paramsSchema,
          headers: headersSchema,
        },
        async (ctx) => {
          return new Response(
            JSON.stringify({
              body: ctx.body,
              query: ctx.query,
              params: ctx.params,
              headers: { auth: ctx.headers.auth },
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        },
      ),
    );

    const response = await (
      await app.ready()
    )(
      new Request("http://localhost/test/123?page=1", {
        method: "POST",
        body: JSON.stringify({ name: "test" }),
        headers: { "Content-Type": "application/json", auth: "Bearer token" },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      body: { name: "test" },
      query: { page: "1" },
      params: { id: "123" },
      headers: { auth: "Bearer token" },
    });
  });

  it("should throw ValidationError when multiple sources fail", async () => {
    const bodySchema = z.object({
      name: z.string(),
    });
    const querySchema = z.object({
      page: z.string(),
    });

    let capturedError: Error | undefined;
    const app = new Raven();
    app.post(
      "/test",
      withSchema({ body: bodySchema, query: querySchema }, async () => new Response("OK")),
    );
    app.onError((err) => {
      capturedError = err;
      return new Response("Error", { status: 400 });
    });

    await (
      await app.ready()
    )(
      new Request("http://localhost/test", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(isValidationError(capturedError!)).toBe(true);
    expect((capturedError as ReturnType<typeof Object.assign>).bodyIssues).toBeDefined();
    expect((capturedError as ReturnType<typeof Object.assign>).queryIssues).toBeDefined();
  });

  it("should handle missing schema gracefully", async () => {
    const app = new Raven();
    app.get(
      "/test",
      withSchema({}, async (ctx) => {
        return new Response(
          JSON.stringify({
            body: ctx.body,
            query: ctx.query,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    const response = await (await app.ready())(new Request("http://localhost/test"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      body: undefined,
      query: {},
    });
  });

  it("should handle async validation", async () => {
    const bodySchema = z.object({
      name: z.string(),
    });

    const app = new Raven();
    app.post(
      "/test",
      withSchema({ body: bodySchema }, async (ctx) => {
        return new Response(JSON.stringify(ctx.body), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const response = await (
      await app.ready()
    )(
      new Request("http://localhost/test", {
        method: "POST",
        body: JSON.stringify({ name: "async test" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ name: "async test" });
  });

  it("should validate response schema and serialize schema output as json", async () => {
    const responseSchema = z.object({
      page: z.string().transform((value) => Number(value)),
    });

    let beforeResponseBody: unknown;
    const app = new Raven();
    app.beforeResponse(async (response) => {
      beforeResponseBody = await response.clone().json();
    });
    app.get(
      "/test",
      withSchema({ response: responseSchema }, async () => {
        return { page: "8" };
      }),
    );

    const response = await (await app.ready())(new Request("http://localhost/test"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ page: 8 });
    expect(beforeResponseBody).toEqual({ page: 8 });
  });

  it("should trigger response validation hook and fall back to raw json when response validation fails", async () => {
    const responseSchema = z.object({
      page: z.string().transform((value) => Number(value)),
    });

    let capturedError: Error | undefined;
    let capturedPayload: unknown;
    let beforeResponseBody: unknown;
    let onErrorCalled = false;
    const app = new Raven();
    app.beforeResponse(async (response) => {
      beforeResponseBody = await response.clone().json();
    });
    app.onResponseValidationError((failure) => {
      capturedError = failure.error;
      capturedPayload = failure.value;
    });
    app.get(
      "/test",
      withSchema({ response: responseSchema }, async () => {
        return { page: 8 } as any;
      }),
    );
    app.onError((err) => {
      onErrorCalled = true;
      capturedError = err;
      return new Response("Error", { status: 500 });
    });

    const response = await (await app.ready())(new Request("http://localhost/test"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ page: 8 });
    expect(beforeResponseBody).toEqual({ page: 8 });
    expect(capturedPayload).toEqual({ page: 8 });
    expect(onErrorCalled).toBe(false);
    expect(isValidationError(capturedError!)).toBe(true);
    expect((capturedError as ReturnType<typeof Object.assign>).responseIssues).toBeDefined();
  });

  it("should ignore response validation hook errors and still return fallback json", async () => {
    const responseSchema = z.object({
      page: z.string().transform((value) => Number(value)),
    });

    const app = new Raven();
    const originalConsoleError = console.error;
    try {
      console.error = () => {};
      app.onResponseValidationError(() => {
        throw new Error("hook failed");
      });
      app.get(
        "/test",
        withSchema({ response: responseSchema }, async () => {
          return { page: 9 } as any;
        }),
      );

      const response = await (await app.ready())(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ page: 9 });
    } finally {
      console.error = originalConsoleError;
    }
  });
});
