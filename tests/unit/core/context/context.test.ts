import { describe, test, expect } from "bun:test";
import { Raven, RavenContext } from "../../../../packages/core";

describe("Raven Context Assembly", () => {
  test("onRequest should NOT have access to params and query, but beforeHandle SHOULD", async () => {
    const app = new Raven();
    let onRequestHasCtx = true;
    let beforeHandleParams: any = null;
    let beforeHandleQuery: any = null;

    app.onRequest((req) => {
      const ctx = RavenContext.get();
      onRequestHasCtx = !!ctx;
    });

    app.beforeHandle(() => {
      const ctx = RavenContext.get();
      if (ctx) {
        beforeHandleParams = { ...ctx.params };
        beforeHandleQuery = { ...ctx.query };
      }
    });

    app.get("/user/:id", () => new Response("ok"));

    const fetch = await app.ready();
    await fetch(new Request("http://localhost/user/123?name=raven"));

    expect(onRequestHasCtx).toBe(false);
    expect(beforeHandleParams).toEqual({ id: "123" });
    expect(beforeHandleQuery).toEqual({ name: "raven" });
  });
});
