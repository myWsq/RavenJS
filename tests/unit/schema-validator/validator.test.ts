import { describe, expect, it } from "bun:test";
import { withSchema, isValidationError } from "../../../modules/schema-validator";
import {
  BodyState,
  QueryState,
  ParamsState,
  HeadersState,
  requestStorage,
} from "../../../modules/core";
import { z } from "zod";

describe("withSchema", () => {
  it("should pass validated body to handler", async () => {
    const bodySchema = z.object({
      name: z.string(),
    });

    const wrappedHandler = withSchema({ body: bodySchema }, async (ctx) => {
      return new Response(JSON.stringify(ctx.body), {
        headers: { "Content-Type": "application/json" },
      });
    });

    const response = await requestStorage.run(new Map(), async () => {
      BodyState.set({ name: "test" });
      return wrappedHandler();
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ name: "test" });
  });

  it("should throw ValidationError when body validation fails", async () => {
    const bodySchema = z.object({
      name: z.string(),
    });

    const wrappedHandler = withSchema({ body: bodySchema }, async () => new Response("OK"));

    const error = await requestStorage.run(new Map(), async () => {
      BodyState.set({});
      return wrappedHandler().catch((err) => err);
    });

    expect(isValidationError(error)).toBe(true);
    expect(error.bodyIssues).toBeDefined();
  });

  it("should pass validated query to handler", async () => {
    const querySchema = z.object({
      page: z.string(),
    });

    const wrappedHandler = withSchema({ query: querySchema }, async (ctx) => {
      return new Response(JSON.stringify(ctx.query), {
        headers: { "Content-Type": "application/json" },
      });
    });

    const response = await requestStorage.run(new Map(), async () => {
      QueryState.set({ page: "1" });
      return wrappedHandler();
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ page: "1" });
  });

  it("should throw ValidationError when query validation fails", async () => {
    const querySchema = z.object({
      page: z.string(),
    });

    const wrappedHandler = withSchema({ query: querySchema }, async () => new Response("OK"));

    const error = await requestStorage.run(new Map(), async () => {
      QueryState.set({});
      return wrappedHandler().catch((err) => err);
    });

    expect(isValidationError(error)).toBe(true);
    expect(error.queryIssues).toBeDefined();
  });

  it("should pass validated params to handler", async () => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const wrappedHandler = withSchema({ params: paramsSchema }, async (ctx) => {
      return new Response(JSON.stringify(ctx.params), {
        headers: { "Content-Type": "application/json" },
      });
    });

    const response = await requestStorage.run(new Map(), async () => {
      ParamsState.set({ id: "123" });
      return wrappedHandler();
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: "123" });
  });

  it("should throw ValidationError when params validation fails", async () => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const wrappedHandler = withSchema({ params: paramsSchema }, async () => new Response("OK"));

    const error = await requestStorage.run(new Map(), async () => {
      ParamsState.set({});
      return wrappedHandler().catch((err) => err);
    });

    expect(isValidationError(error)).toBe(true);
    expect(error.paramsIssues).toBeDefined();
  });

  it("should pass validated headers to handler", async () => {
    const headersSchema = z.object({
      authorization: z.string(),
    });

    const wrappedHandler = withSchema({ headers: headersSchema }, async (ctx) => {
      return new Response(JSON.stringify(ctx.headers), {
        headers: { "Content-Type": "application/json" },
      });
    });

    const response = await requestStorage.run(new Map(), async () => {
      HeadersState.set({ authorization: "Bearer token" });
      return wrappedHandler();
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ authorization: "Bearer token" });
  });

  it("should throw ValidationError when headers validation fails", async () => {
    const headersSchema = z.object({
      authorization: z.string(),
    });

    const wrappedHandler = withSchema({ headers: headersSchema }, async () => new Response("OK"));

    const error = await requestStorage.run(new Map(), async () => {
      HeadersState.set({});
      return wrappedHandler().catch((err) => err);
    });

    expect(isValidationError(error)).toBe(true);
    expect(error.headersIssues).toBeDefined();
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

    const wrappedHandler = withSchema(
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
            headers: ctx.headers,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    );

    const response = await requestStorage.run(new Map(), async () => {
      BodyState.set({ name: "test" });
      QueryState.set({ page: "1" });
      ParamsState.set({ id: "123" });
      HeadersState.set({ auth: "Bearer token" });
      return wrappedHandler();
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      body: { name: "test" },
      query: { page: "1" },
      params: { id: "123" },
      headers: { auth: "Bearer token" },
    });
  });

  it("should throw first ValidationError when multiple fail", async () => {
    const bodySchema = z.object({
      name: z.string(),
    });
    const querySchema = z.object({
      page: z.string(),
    });

    const wrappedHandler = withSchema(
      { body: bodySchema, query: querySchema },
      async () => new Response("OK"),
    );

    const error = await requestStorage.run(new Map(), async () => {
      BodyState.set({});
      QueryState.set({});
      return wrappedHandler().catch((err) => err);
    });

    expect(isValidationError(error)).toBe(true);
    expect(error.bodyIssues).toBeDefined();
    expect(error.queryIssues).toBeDefined();
  });

  it("should handle missing schema gracefully", async () => {
    const wrappedHandler = withSchema({}, async (ctx) => {
      return new Response(
        JSON.stringify({
          body: ctx.body,
          query: ctx.query,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    });

    const response = await requestStorage.run(new Map(), async () => {
      return wrappedHandler();
    });

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

    const wrappedHandler = withSchema({ body: bodySchema }, async (ctx) => {
      return new Response(JSON.stringify(ctx.body), {
        headers: { "Content-Type": "application/json" },
      });
    });

    const response = await requestStorage.run(new Map(), async () => {
      BodyState.set({ name: "async test" });
      return wrappedHandler();
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ name: "async test" });
  });
});
