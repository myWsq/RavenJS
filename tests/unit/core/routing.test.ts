import { describe, expect, it, mock } from "bun:test";
import { Raven, RavenContext } from "../../../modules/core";

describe("Routing System", () => {
  it("should match simple GET route", async () => {
    const raven = new Raven();
    const handler = mock(() => new Response("ok"));
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
