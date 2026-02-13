import { describe, it, expect } from "@ravenjs/testing";
import { Raven, RavenContext, type Context } from "../main";
import { createAppState, createRequestState, currentAppStorage, requestStorage } from "../utils/state";

describe("Unified State Mount (AppState & RequestState)", () => {
  describe("RequestState", () => {
    it("should maintain isolation between concurrent requests", async () => {
      const RequestId = createRequestState<string>("requestId");

      const handleRequest = async (id: string) => {
        return requestStorage.run(new Map(), async () => {
          RequestId.set(id);
          await new Promise((r) => setTimeout(r, Math.random() * 10));
          return RequestId.get();
        });
      };

      const results = await Promise.all([
        handleRequest("req-1"),
        handleRequest("req-2"),
        handleRequest("req-3"),
      ]);

      expect(results).toEqual(["req-1", "req-2", "req-3"]);
    });

    it("should work with RavenContext in Raven.handleRequest", async () => {
      const app = new Raven();
      app.get("/test", () => {
        const ctx = RavenContext.getOrFailed();
        return new Response(ctx.url.pathname);
      });

      const res = await app.handleRequest(new Request("http://localhost/test"));
      expect(await res.text()).toBe("/test");
    });
  });

  describe("AppState", () => {
    it("should isolate state between Raven instances", async () => {
      const Config = createAppState<{ db: string }>("config");
      const app1 = new Raven();
      const app2 = new Raven();

      await currentAppStorage.run(app1, () => {
        Config.set({ db: "mysql" });
      });

      await currentAppStorage.run(app2, () => {
        Config.set({ db: "postgres" });
      });

      await currentAppStorage.run(app1, () => {
        expect(Config.get()?.db).toBe("mysql");
      });

      await currentAppStorage.run(app2, () => {
        expect(Config.get()?.db).toBe("postgres");
      });
    });

    it("should inherit state from parent Raven instances", async () => {
      const GlobalConfig = createAppState<string>("global");
      const root = new Raven();

      await currentAppStorage.run(root, async () => {
        GlobalConfig.set("root-value");

        await root.group("/v1", async (v1) => {
          // Inside group, it should see root's state
          expect(GlobalConfig.get()).toBe("root-value");

          // Override in child
          GlobalConfig.set("v1-value");
          expect(GlobalConfig.get()).toBe("v1-value");
        });

        // Root remains unchanged
        expect(GlobalConfig.get()).toBe("root-value");
      });
    });

    it("should support穿透 (AppState accessible in Request context)", async () => {
      const DB = createAppState<string>("db");
      const app = new Raven();

      await currentAppStorage.run(app, () => {
        DB.set("client-ready");
      });

      app.get("/db", () => {
        return new Response(DB.getOrFailed());
      });

      const res = await app.handleRequest(new Request("http://localhost/db"));
      expect(await res.text()).toBe("client-ready");
    });
  });

  describe("Error Handling", () => {
    it("should throw when setting state without context", () => {
      const SomeState = createAppState<string>("test");
      expect(() => SomeState.set("fail")).toThrow("Cannot set value for state \"test\": Scope is not initialized");
    });

    it("should return undefined when getting state without context", () => {
      const SomeState = createAppState<string>("test");
      expect(SomeState.get()).toBeUndefined();
    });

    it("should throw in getOrFailed when state is missing", async () => {
      const Required = createAppState<string>("required");
      const app = new Raven();
      await currentAppStorage.run(app, () => {
        expect(() => Required.getOrFailed()).toThrow("State is not initialized. Cannot access state: required");
      });
    });
  });
});
