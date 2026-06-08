import { describe, it, expect } from "vitest";
import { Raven, RavenContext, withSchema } from "../../../../packages/core/index.ts";

describe("Hono engine guarantees", () => {
  it("isolates request-scoped ambient state across concurrent requests", async () => {
    const app = new Raven();
    app.get("/echo/:v", async () => {
      // Yield so the two in-flight requests interleave; if the per-request
      // AsyncLocalStorage scope leaked across `hono.fetch`, the params would mix up.
      await new Promise((resolve) => setTimeout(resolve, 5));
      return new Response(RavenContext.getOrFailed().params.v);
    });
    const fetch = await app.ready();

    const [a, b] = await Promise.all([
      fetch(new Request("http://localhost/echo/AAA")),
      fetch(new Request("http://localhost/echo/BBB")),
    ]);

    expect(await a.text()).toBe("AAA");
    expect(await b.text()).toBe("BBB");
  });

  it("never exposes Hono's context to handlers — only { body, query, params, headers }", async () => {
    const app = new Raven();
    let receivedKeys: string[] = [];
    app.post(
      "/shape",
      withSchema({}, async (ctx) => {
        receivedKeys = Object.keys(ctx as Record<string, unknown>);
        return new Response("ok");
      }),
    );
    const fetch = await app.ready();
    await fetch(new Request("http://localhost/shape", { method: "POST" }));

    expect(receivedKeys.sort()).toEqual(["body", "headers", "params", "query"]);
    // Hono context surface must never reach the handler.
    for (const honoKey of ["req", "c", "env", "var", "res", "json", "text", "header"]) {
      expect(receivedKeys).not.toContain(honoKey);
    }
  });
});
