import { describe, expect, it, vi } from "vitest";
import { Raven, RavenContext } from "../../../../packages/core/index.ts";

describe("Routing System", () => {
  it("should match simple GET route", async () => {
    const raven = new Raven();
    const handler = vi.fn(() => new Response("ok"));
    raven.get("/hello", handler);

    const fetch = await raven.ready();
    const response = await fetch(new Request("http://localhost/hello"));
    expect(await response.text()).toBe("ok");
    expect(handler).toHaveBeenCalled();
  });

  it("should extract path parameters", async () => {
    const raven = new Raven();
    raven.get("/user/:id", () => {
      const ctx = RavenContext.get();
      return new Response(`User ${ctx?.params.id}`);
    });

    const fetch = await raven.ready();
    const response = await fetch(new Request("http://localhost/user/123"));
    expect(await response.text()).toBe("User 123");
  });

  it("should extract multiple path parameters", async () => {
    const raven = new Raven();
    raven.get("/org/:orgId/project/:projectId", () => {
      const ctx = RavenContext.get();
      return new Response(`Org: ${ctx?.params.orgId}, Project: ${ctx?.params.projectId}`);
    });

    const fetch = await raven.ready();
    const response = await fetch(new Request("http://localhost/org/raven/project/routing"));
    expect(await response.text()).toBe("Org: raven, Project: routing");
  });

  it("should extract query parameters", async () => {
    const raven = new Raven();
    raven.get("/search", () => {
      const ctx = RavenContext.get();
      return new Response(`Search: ${ctx?.query.q}`);
    });

    const fetch = await raven.ready();
    const response = await fetch(new Request("http://localhost/search?q=raven"));
    expect(await response.text()).toBe("Search: raven");
  });

  it("should assemble context correctly (onRequest vs beforeHandle)", async () => {
    const raven = new Raven();
    let onRequestParams: any = undefined;
    let beforeHandleParams: any = undefined;

    raven.onRequest(() => {
      const ctx = RavenContext.get();
      if (ctx) {
        onRequestParams = ctx.params;
      }
    });

    raven.get("/test/:id", () => {
      const ctx = RavenContext.get();
      if (ctx) {
        beforeHandleParams = ctx.params;
      }
      return new Response("ok");
    });

    const fetch = await raven.ready();
    await fetch(new Request("http://localhost/test/123"));

    expect(onRequestParams).toBeUndefined();
    expect(beforeHandleParams).toEqual({ id: "123" });
  });

  it("should return 404 for unknown routes", async () => {
    const raven = new Raven();
    const fetch = await raven.ready();
    const response = await fetch(new Request("http://localhost/unknown"));
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });
});

describe("Routing System (3.x Hono engine semantics)", () => {
  it("returns 404 for HEAD on a GET-only route without running the handler", async () => {
    const raven = new Raven();
    let handlerRan = false;
    let onErrorSaw = "";
    raven.onError((err) => {
      onErrorSaw = err.message;
    });
    raven.get("/head-test", () => {
      handlerRan = true;
      return new Response("body");
    });

    const fetch = await raven.ready();
    const response = await fetch(new Request("http://localhost/head-test", { method: "HEAD" }));

    expect(response.status).toBe(404);
    expect(handlerRan).toBe(false);
    expect(onErrorSaw).toBe("Not Found");
  });

  it("distinguishes trailing slash (strict matching)", async () => {
    const raven = new Raven();
    raven.get("/strict", () => new Response("ok"));

    const fetch = await raven.ready();
    expect((await fetch(new Request("http://localhost/strict"))).status).toBe(200);
    expect((await fetch(new Request("http://localhost/strict/"))).status).toBe(404);
  });

  it("decodes percent-encoded path parameters", async () => {
    const raven = new Raven();
    raven.get("/decode/:name", () => new Response(RavenContext.get()?.params.name));

    const fetch = await raven.ready();
    const response = await fetch(new Request("http://localhost/decode/a%20b"));
    expect(await response.text()).toBe("a b");
  });

  it("matches wildcard routes including zero trailing segments", async () => {
    const raven = new Raven();
    raven.get("/files/*", () => new Response("wild"));

    const fetch = await raven.ready();
    expect((await fetch(new Request("http://localhost/files/a/b"))).status).toBe(200);
    expect((await fetch(new Request("http://localhost/files/"))).status).toBe(200);
  });
});
