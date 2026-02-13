import { describe, expect, it, vi } from "@ravenjs/testing";
import { Raven, RavenContext } from "../main";

describe("Integration: Router & Context", () => {
  it("should extract path parameters and query strings into Context", async () => {
    const raven = new Raven();
    let capturedParams: any = null;
    let capturedQuery: any = null;

    raven.get("/user/:id", () => {
      const ctx = RavenContext.get();
      capturedParams = ctx?.params;
      capturedQuery = ctx?.query;
      return new Response("ok");
    });

    const request = new Request("http://localhost/user/123?foo=bar&baz=qux");
    // @ts-ignore - calling private handleRequest for testing
    await raven.handleRequest(request);

    expect(capturedParams).toEqual({ id: "123" });
    expect(capturedQuery).toEqual({ foo: "bar", baz: "qux" });
  });

  it("should not have Context available in global onRequest hook", async () => {
    const raven = new Raven();
    let contextInOnRequest: any = undefined;

    raven.onRequest((req) => {
      contextInOnRequest = RavenContext.get();
    });

    raven.get("/test", () => new Response("ok"));

    const request = new Request("http://localhost/test");
    // @ts-ignore
    await raven.handleRequest(request);

    expect(contextInOnRequest).toBeUndefined();
  });

  it("should register the official router plugin using factory pattern", async () => {
    const raven = new Raven();
    const { routerPlugin } = await import("../../plugins/router/index");
    
    let pluginInitialized = false;
    const originalConsoleLog = console.log;
    console.log = vi.fn();

    await raven.register(routerPlugin({ some: "opt" }));
    
    expect(console.log).toHaveBeenCalledWith("Router plugin initialized", { some: "opt" });
    console.log = originalConsoleLog;
  });
});
