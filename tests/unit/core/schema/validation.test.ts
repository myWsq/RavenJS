import { describe, expect, it } from "bun:test";
import { QueryState, Raven, isValidationError, withSchema } from "../../../../modules/core";
import { z } from "zod";

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
      beforeHandlePage = (QueryState.getOrFailed() as { page: number }).page;
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
});
