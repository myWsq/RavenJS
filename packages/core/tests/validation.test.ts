import { describe, it, expect } from "@ravenjs/testing";
import { Raven, createHandler, J, useBody, useQuery, useParams, useHeaders } from "../main";

describe("Handler State Validation", () => {
  describe("Body Validation", () => {
    it("should validate and inject body data", async () => {
      const BodySchema = J.object({
        name: J.string(),
        age: J.int(),
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler()
          .bodySchema(BodySchema)
          .handle(() => {
            const body = useBody(BodySchema);
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
      const BodySchema = J.object({
        name: J.string(),
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler()
          .bodySchema(BodySchema)
          .handle(() => {
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
    });

    it("should parse number from string in body", async () => {
      const BodySchema = J.object({
        count: J.int(),
      });

      const app = new Raven();
      app.post(
        "/count",
        createHandler()
          .bodySchema(BodySchema)
          .handle(() => {
            const body = useBody(BodySchema);
            return new Response(
              `Count type: ${typeof body.count}, value: ${body.count}`
            );
          })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: 42 }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Count type: number, value: 42");
    });
  });

  describe("Query Validation", () => {
    it("should validate and inject query parameters", async () => {
      const QuerySchema = J.object({
        page: J.string(),
        limit: J.string(),
      });

      const app = new Raven();
      app.get(
        "/items",
        createHandler()
          .querySchema(QuerySchema)
          .handle(() => {
            const query = useQuery(QuerySchema);
            return new Response(`Page: ${query.page}, Limit: ${query.limit}`);
          })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/items?page=2&limit=20")
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Page: 2, Limit: 20");
    });
  });

  describe("Params Validation", () => {
    it("should validate and inject path parameters", async () => {
      const ParamsSchema = J.object({
        id: J.string(),
      });

      const app = new Raven();
      app.get(
        "/users/:id",
        createHandler()
          .paramsSchema(ParamsSchema)
          .handle(() => {
            const params = useParams(ParamsSchema);
            return new Response(`User ID: ${params.id}`);
          })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/users/123")
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("User ID: 123");
    });
  });

  describe("Headers Validation", () => {
    it("should validate and inject headers", async () => {
      const HeadersSchema = J.object({
        "x-api-key": J.string(),
      });

      const app = new Raven();
      app.get(
        "/protected",
        createHandler()
          .headersSchema(HeadersSchema)
          .handle(() => {
            const headers = useHeaders(HeadersSchema);
            return new Response(`API Key: ${headers["x-api-key"]}`);
          })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/protected", {
          headers: { "X-API-Key": "secret-key-123" },
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("API Key: secret-key-123");
    });
  });

  describe("Multiple Schemas", () => {
    it("should handle multiple schemas in one handler", async () => {
      const BodySchema = J.object({
        name: J.string(),
      });

      const QuerySchema = J.object({
        format: J.string(),
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler()
          .bodySchema(BodySchema)
          .querySchema(QuerySchema)
          .handle(() => {
            const body = useBody(BodySchema);
            const query = useQuery(QuerySchema);
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

  describe("Handler without Schemas", () => {
    it("should work normally without schemas", async () => {
      const app = new Raven();
      app.get(
        "/health",
        createHandler().handle(() => new Response("OK"))
      );

      const res = await app.handleRequest(
        new Request("http://localhost/health")
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("OK");
    });
  });

  describe("Optional Fields", () => {
    it("should validate optional fields when present", async () => {
      const BodySchema = J.object({
        name: J.string(),
        bio: J.string().optional(),
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler()
          .bodySchema(BodySchema)
          .handle(() => {
            const body = useBody(BodySchema);
            return new Response(`Name: ${body.name}, Bio: ${body.bio ?? "N/A"}`);
          })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Alice", bio: "Developer" }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Name: Alice, Bio: Developer");
    });

    it("should accept missing optional fields", async () => {
      const BodySchema = J.object({
        name: J.string(),
        bio: J.string().optional(),
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler()
          .bodySchema(BodySchema)
          .handle(() => {
            const body = useBody(BodySchema);
            return new Response(`Name: ${body.name}, Bio: ${body.bio ?? "N/A"}`);
          })
      );

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
  });

  describe("Nullable Fields", () => {
    it("should accept null for nullable fields", async () => {
      const BodySchema = J.object({
        name: J.string(),
        nickname: J.string().nullable(),
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler()
          .bodySchema(BodySchema)
          .handle(() => {
            const body = useBody(BodySchema);
            return new Response(`Name: ${body.name}, Nickname: ${body.nickname ?? "none"}`);
          })
      );

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

    it("should accept non-null value for nullable fields", async () => {
      const BodySchema = J.object({
        name: J.string(),
        nickname: J.string().nullable(),
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler()
          .bodySchema(BodySchema)
          .handle(() => {
            const body = useBody(BodySchema);
            return new Response(`Name: ${body.name}, Nickname: ${body.nickname ?? "none"}`);
          })
      );

      const res = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Alice", nickname: "Ali" }),
        })
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Name: Alice, Nickname: Ali");
    });
  });

  describe("Optional + Nullable Combination", () => {
    it("should handle optional nullable fields", async () => {
      const BodySchema = J.object({
        name: J.string(),
        avatar: J.string().optional().nullable(),
      });

      const app = new Raven();
      app.post(
        "/users",
        createHandler()
          .bodySchema(BodySchema)
          .handle(() => {
            const body = useBody(BodySchema);
            return new Response(`Name: ${body.name}, Avatar: ${body.avatar ?? "default"}`);
          })
      );

      const resWithNull = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Alice", avatar: null }),
        })
      );
      expect(resWithNull.status).toBe(200);
      expect(await resWithNull.text()).toBe("Name: Alice, Avatar: default");

      const resWithoutField = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Bob" }),
        })
      );
      expect(resWithoutField.status).toBe(200);
      expect(await resWithoutField.text()).toBe("Name: Bob, Avatar: default");

      const resWithValue = await app.handleRequest(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Charlie", avatar: "avatar.png" }),
        })
      );
      expect(resWithValue.status).toBe(200);
      expect(await resWithValue.text()).toBe("Name: Charlie, Avatar: avatar.png");
    });
  });
});
