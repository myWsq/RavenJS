import { describe, it, expect } from "@ravenjs/testing";
import { Raven, BodyState, QueryState, ParamsState } from "../../modules/core";
import { J, useBody, useQuery, useParams, useHeaders } from "../../modules/jtd-validator";

describe("JTD Validator - Lazy Validation", () => {
  describe("useBody", () => {
    it("should validate and return body data on useBody call", async () => {
      const BodySchema = J.object({
        name: J.string(),
        age: J.int(),
      });

      const app = new Raven();
      app.post("/users", () => {
        const body = useBody(BodySchema);
        return new Response(`Hello, ${body.name}! Age: ${body.age}`);
      });

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

    it("should throw validation error for invalid body", async () => {
      const BodySchema = J.object({
        name: J.string(),
      });

      const app = new Raven();
      app.post("/users", () => {
        const body = useBody(BodySchema);
        return new Response(`Name: ${body.name}`);
      });

      const res = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ age: 30 }),
        })
      );

      expect(res.status).toBe(400);
    });

    it("should validate optional fields correctly", async () => {
      const BodySchema = J.object({
        name: J.string(),
        bio: J.string().optional(),
      });

      const app = new Raven();
      app.post("/users", () => {
        const body = useBody(BodySchema);
        return new Response(`Name: ${body.name}, Bio: ${body.bio ?? "N/A"}`);
      });

      const res = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Bob" }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Name: Bob, Bio: N/A");
    });

    it("should validate nullable fields correctly", async () => {
      const BodySchema = J.object({
        name: J.string(),
        nickname: J.string().nullable(),
      });

      const app = new Raven();
      app.post("/users", () => {
        const body = useBody(BodySchema);
        return new Response(`Name: ${body.name}, Nickname: ${body.nickname ?? "none"}`);
      });

      const res = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Alice", nickname: null }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Name: Alice, Nickname: none");
    });
  });

  describe("useQuery", () => {
    it("should validate and return query parameters", async () => {
      const QuerySchema = J.object({
        page: J.string(),
        limit: J.string(),
      });

      const app = new Raven();
      app.get("/items", () => {
        const query = useQuery(QuerySchema);
        return new Response(`Page: ${query.page}, Limit: ${query.limit}`);
      });

      const res = await app.handleRequest(
        new Request("http://localhost/items?page=2&limit=20")
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Page: 2, Limit: 20");
    });
  });

  describe("useParams", () => {
    it("should validate and return path parameters", async () => {
      const ParamsSchema = J.object({
        id: J.string(),
      });

      const app = new Raven();
      app.get("/users/:id", () => {
        const params = useParams(ParamsSchema);
        return new Response(`User ID: ${params.id}`);
      });

      const res = await app.handleRequest(
        new Request("http://localhost/users/123")
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("User ID: 123");
    });
  });

  describe("useHeaders", () => {
    it("should validate and return headers", async () => {
      const HeadersSchema = J.object({
        "x-api-key": J.string(),
      });

      const app = new Raven();
      app.get("/protected", () => {
        const headers = useHeaders(HeadersSchema);
        return new Response(`API Key: ${headers["x-api-key"]}`);
      });

      const res = await app.handleRequest(
        new Request("http://localhost/protected", {
          headers: { "X-API-Key": "secret-key-123" },
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("API Key: secret-key-123");
    });
  });

  describe("Multiple Validations", () => {
    it("should handle multiple validations in one handler", async () => {
      const BodySchema = J.object({
        name: J.string(),
      });

      const QuerySchema = J.object({
        format: J.string(),
      });

      const app = new Raven();
      app.post("/users", () => {
        const body = useBody(BodySchema);
        const query = useQuery(QuerySchema);
        return new Response(`Name: ${body.name}, Format: ${query.format}`);
      });

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

  describe("Handler without Validation", () => {
    it("should work without using validation hooks", async () => {
      const app = new Raven();
      app.get("/health", () => new Response("OK"));

      const res = await app.handleRequest(
        new Request("http://localhost/health")
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("OK");
    });

    it("should allow raw state access without validation", async () => {
      const app = new Raven();
      app.post("/raw", () => {
        const body = BodyState.get();
        return new Response(`Raw: ${JSON.stringify(body)}`);
      });

      const res = await app.handleRequest(
        new Request("http://localhost/raw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anything: "goes" }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('Raw: {"anything":"goes"}');
    });
  });

  describe("Schema DSL", () => {
    it("should build correct JTD schema for object with required fields", () => {
      const schema = J.object({
        name: J.string(),
        age: J.int(),
      });

      expect(schema.schema).toEqual({
        properties: {
          name: { type: "string" },
          age: { type: "int32" },
        },
      });
    });

    it("should build correct JTD schema with optional fields", () => {
      const schema = J.object({
        name: J.string(),
        bio: J.string().optional(),
      });

      expect(schema.schema).toEqual({
        properties: {
          name: { type: "string" },
        },
        optionalProperties: {
          bio: { type: "string" },
        },
      });
    });

    it("should build correct JTD schema with nullable fields", () => {
      const schema = J.object({
        name: J.string().nullable(),
      });

      expect(schema.schema).toEqual({
        properties: {
          name: { type: "string", nullable: true },
        },
      });
    });

    it("should build correct JTD schema for arrays", () => {
      const schema = J.array(J.string());

      expect(schema.schema).toEqual({
        elements: { type: "string" },
      });
    });

    it("should build correct JTD schema for records", () => {
      const schema = J.record(J.int());

      expect(schema.schema).toEqual({
        values: { type: "int32" },
      });
    });

    it("should build correct JTD schema for enums", () => {
      const schema = J.enum(["active", "inactive", "pending"] as const);

      expect(schema.schema).toEqual({
        enum: ["active", "inactive", "pending"],
      });
    });
  });

  describe("Validator Caching", () => {
    it("should reuse compiled validator for same schema", async () => {
      const BodySchema = J.object({
        name: J.string(),
      });

      const app = new Raven();
      app.post("/test", () => {
        useBody(BodySchema);
        useBody(BodySchema);
        return new Response("OK");
      });

      const res = await app.handleRequest(
        new Request("http://localhost/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test" }),
        })
      );

      expect(res.status).toBe(200);
    });
  });
});
