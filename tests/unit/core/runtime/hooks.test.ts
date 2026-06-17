import { describe, test, expect } from "vitest";
import { Raven, RavenContext } from "../../../../packages/core/index.ts";

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

  test("should route beforeResponse hook errors through onError", async () => {
    const app = new Raven();
    let errorCaught = false;

    app.beforeResponse(() => {
      throw new Error("br-fail");
    });
    app.onError((err) => {
      errorCaught = true;
      return new Response(err.message, { status: 500 });
    });

    app.get("/", () => new Response("ok"));

    const fetch = await app.ready();
    const response = await fetch(new Request("http://localhost/"));

    expect(errorCaught).toBe(true);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe("br-fail");
  });
});

/**
 * 回归：钩子/handler 返回的 Response 必须用品牌检测（Symbol.toStringTag）识别，
 * 不能用 `instanceof Response`。某些运行时适配器（如 @hono/node-server 默认
 * overrideGlobalObjects）会替换 globalThis.Response，使框架捕获到的 Response 与
 * 业务代码构造的 Response 来自不同类，instanceof 失效，导致返回的 Response 被丢弃、
 * 业务错误穿透为默认 500/404（GitHub issue #4）。
 *
 * 这里把 globalThis.Response 临时换成一个与原生 Response 无 instanceof 关系的类来复刻
 * 该场景，而钩子仍返回原生 Response（保存的 NativeResponse）。修复前这些用例会拿到
 * 默认 500/404；修复后应正确返回钩子的 Response。
 */
describe("Response detection survives a swapped globalThis.Response (issue #4)", () => {
  function withSwappedGlobalResponse<T>(run: (native: typeof Response) => Promise<T>): Promise<T> {
    const NativeResponse = globalThis.Response;
    class ForeignResponse {} // 与原生 Response 无原型链关系 → instanceof 必然失败
    (globalThis as unknown as { Response: unknown }).Response = ForeignResponse;
    return run(NativeResponse).finally(() => {
      (globalThis as unknown as { Response: unknown }).Response = NativeResponse;
    });
  }

  test("onError Response wins when a handler throws", async () => {
    await withSwappedGlobalResponse(async (NativeResponse) => {
      const app = new Raven();
      app.onError(() => NativeResponse.json({ handled: true }, { status: 418 }));
      app.get("/boom", () => {
        throw new Error("boom");
      });

      const fetch = await app.ready();
      const response = await fetch(new Request("http://localhost/boom"));

      expect(response.status).toBe(418);
      expect(await response.json()).toEqual({ handled: true });
    });
  });

  test("onError Response wins on a route miss (notFound)", async () => {
    await withSwappedGlobalResponse(async (NativeResponse) => {
      const app = new Raven();
      app.onError(() => NativeResponse.json({ handled: true }, { status: 418 }));
      app.get("/exists", () => new Response("ok"));

      const fetch = await app.ready();
      const response = await fetch(new Request("http://localhost/missing"));

      expect(response.status).toBe(418);
    });
  });

  test("onRequest short-circuit Response is honored", async () => {
    await withSwappedGlobalResponse(async (NativeResponse) => {
      const app = new Raven();
      app.onRequest(() => NativeResponse.json({ short: true }, { status: 418 }));
      app.get("/", () => new Response("handler"));

      const fetch = await app.ready();
      const response = await fetch(new Request("http://localhost/"));

      expect(response.status).toBe(418);
    });
  });

  test("beforeResponse replacement Response is honored", async () => {
    await withSwappedGlobalResponse(async (NativeResponse) => {
      const app = new Raven();
      app.beforeResponse(() => NativeResponse.json({ wrapped: true }, { status: 418 }));
      app.get("/", () => new Response("handler"));

      const fetch = await app.ready();
      const response = await fetch(new Request("http://localhost/"));

      expect(response.status).toBe(418);
      expect(await response.json()).toEqual({ wrapped: true });
    });
  });
});
