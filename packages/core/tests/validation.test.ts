import { describe, it, expect } from "@ravenjs/testing";
import { Raven, createHandler } from "../main";
import { createRequestState } from "../utils/state";

describe("State Slots Validation", () => {
  describe("Body Validation", () => {
    it("should validate and inject body data", async () => {
      const BodyState = createRequestState<{ name: string; age: number }>({
        name: "body",
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          required: ["name", "age"],
        },
        source: "body",
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler({ slots: [BodyState] }, () => {
          const body = BodyState.getOrFailed();
          return new Response(`Hello, ${body.name}! Age: ${body.age}`);
        })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Alice", age: 30 }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Hello, Alice! Age: 30");
    });

    it("should return 400 for invalid body", async () => {
      const BodyState = createRequestState<{ name: string }>({
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
        },
        source: "body",
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler({ slots: [BodyState] }, () => {
          return new Response("OK");
        })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ age: 30 }),
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toContain("name");
    });

    it("should coerce types when possible", async () => {
      const BodyState = createRequestState<{ count: number }>({
        schema: {
          type: "object",
          properties: {
            count: { type: "number" },
          },
        },
        source: "body",
      });

      const app = new Raven();
      app.post(
        "/count",
        createHandler({ slots: [BodyState] }, () => {
          const body = BodyState.getOrFailed();
          return new Response(`Count type: ${typeof body.count}, value: ${body.count}`);
        })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: "42" }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Count type: number, value: 42");
    });
  });

  describe("Query Validation", () => {
    it("should validate and inject query parameters", async () => {
      const QueryState = createRequestState<{ page: number; limit: number }>({
        schema: {
          type: "object",
          properties: {
            page: { type: "number", default: 1 },
            limit: { type: "number", default: 10 },
          },
        },
        source: "query",
      });

      const app = new Raven();
      app.get(
        "/items",
        createHandler({ slots: [QueryState] }, () => {
          const query = QueryState.getOrFailed();
          return new Response(`Page: ${query.page}, Limit: ${query.limit}`);
        })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/items?page=2&limit=20")
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Page: 2, Limit: 20");
    });

    it("should use default values for missing query params", async () => {
      const QueryState = createRequestState<{ page: number }>({
        schema: {
          type: "object",
          properties: {
            page: { type: "number", default: 1 },
          },
        },
        source: "query",
      });

      const app = new Raven();
      app.get(
        "/items",
        createHandler({ slots: [QueryState] }, () => {
          const query = QueryState.getOrFailed();
          return new Response(`Page: ${query.page}`);
        })
      );

      const res = await app.handleRequest(new Request("http://localhost/items"));

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Page: 1");
    });
  });

  describe("Params Validation", () => {
    it("should validate and inject path parameters", async () => {
      const ParamsState = createRequestState<{ id: string }>({
        schema: {
          type: "object",
          properties: {
            id: { type: "string", minLength: 1 },
          },
          required: ["id"],
        },
        source: "params",
      });

      const app = new Raven();
      app.get(
        "/users/:id",
        createHandler({ slots: [ParamsState] }, () => {
          const params = ParamsState.getOrFailed();
          return new Response(`User ID: ${params.id}`);
        })
      );

      const res = await app.handleRequest(new Request("http://localhost/users/123"));

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("User ID: 123");
    });
  });

  describe("Multiple Slots", () => {
    it("should handle multiple slots in one handler", async () => {
      const BodyState = createRequestState<{ name: string }>({
        schema: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
        source: "body",
      });

      const QueryState = createRequestState<{ format: string }>({
        schema: {
          type: "object",
          properties: { format: { type: "string", default: "json" } },
        },
        source: "query",
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler({ slots: [BodyState, QueryState] }, () => {
          const body = BodyState.getOrFailed();
          const query = QueryState.getOrFailed();
          return new Response(`Name: ${body.name}, Format: ${query.format}`);
        })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/users?format=xml", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Bob" }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Name: Bob, Format: xml");
    });
  });

  describe("Handler without Slots", () => {
    it("should work normally without slots", async () => {
      const app = new Raven();
      app.get("/health", () => new Response("OK"));

      const res = await app.handleRequest(new Request("http://localhost/health"));

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("OK");
    });

    it("should work with createHandler but empty slots", async () => {
      const app = new Raven();
      app.get(
        "/health",
        createHandler({ slots: [] }, () => new Response("OK"))
      );

      const res = await app.handleRequest(new Request("http://localhost/health"));

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("OK");
    });
  });
});
