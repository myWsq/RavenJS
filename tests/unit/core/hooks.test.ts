import { describe, test, expect } from "bun:test";
import { Raven, RavenContext } from "../../../modules/core";

describe("Raven Lifecycle Hooks", () => {
  test("should execute hooks in order and have context access", async () => {
    const app = new Raven();
    const executionOrder: string[] = [];

    app.onRequest((req) => {
      executionOrder.push(`onRequest:${req.method}`);
    });
    app.beforeHandle(() => {
      executionOrder.push("beforeHandle");
    });
    app.beforeResponse((res) => {
      executionOrder.push("beforeResponse");
      return res;
    });

    app.get("/", () => new Response("ok"));

    const fetch = await app.ready();
    await fetch(new Request("http://localhost/"));

    expect(executionOrder).toEqual(["onRequest:GET", "beforeHandle", "beforeResponse"]);
  });

  test("should short-circuit on onRequest return", async () => {
    const app = new Raven();
    const executionOrder: string[] = [];

    app.onRequest(() => {
      executionOrder.push("onRequest");
      return new Response("short-circuit");
    });
    app.beforeHandle(() => {
      executionOrder.push("beforeHandle");
    });

    const fetch = await app.ready();
    const response = await fetch(new Request("http://localhost/"));

    expect(executionOrder).toEqual(["onRequest"]);
    expect(await response.text()).toBe("short-circuit");
  });

  test("should handle errors with onError", async () => {
    const app = new Raven();
    app.beforeHandle(() => {
      throw new Error("test error");
    });

    let errorCaught = false;
    app.onError((err) => {
      errorCaught = true;
      return new Response(err.message, { status: 500 });
    });

    app.get("/", () => {
      throw new Error("test error");
    });

    const fetch = await app.ready();
    const response = await fetch(new Request("http://localhost/"));

    expect(errorCaught).toBe(true);
    expect(await response.text()).toBe("test error");
  });
});
