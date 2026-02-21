import { describe, it, expect } from "@ravenjs/testing";
import {
  Raven,
  RavenContext,
  type Context,
  createAppState,
  createRequestState,
  currentAppStorage,
  requestStorage,
} from "../main";

describe("Unified State Mount (AppState & RequestState)", () => {
  describe("RequestState", () => {
    it("should maintain isolation between concurrent requests", async () => {
      const RequestId = createRequestState<string>({ name: "requestId" });

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
      const Config = createAppState<{ db: string }>({ name: "config" });
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
      const GlobalConfig = createAppState<string>({ name: "global" });
      const root = new Raven();

      await currentAppStorage.run(root, async () => {
        GlobalConfig.set("root-value");

        await root.group("/v1", async (v1) => {
          expect(GlobalConfig.get()).toBe("root-value");
          GlobalConfig.set("v1-value");
          expect(GlobalConfig.get()).toBe("v1-value");
        });

        expect(GlobalConfig.get()).toBe("root-value");
      });
    });

    it("should support穿透 (AppState accessible in Request context)", async () => {
      const DB = createAppState<string>({ name: "db" });
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
      const SomeState = createAppState<string>({ name: "test" });
      expect(() => SomeState.set("fail")).toThrow("Cannot set value for state \"test\": Scope is not initialized");
    });

    it("should return undefined when getting state without context", () => {
      const SomeState = createAppState<string>({ name: "test" });
      expect(SomeState.get()).toBeUndefined();
    });

    it("should throw in getOrFailed when state is missing", async () => {
      const Required = createAppState<string>({ name: "required" });
      const app = new Raven();
      await currentAppStorage.run(app, () => {
        expect(() => Required.getOrFailed()).toThrow("State is not initialized. Cannot access state: required");
      });
    });
  });

  describe("Object Parameter API", () => {
    it("should create state with object parameter", () => {
      const state = createRequestState<string>({ name: "test-state" });
      expect(state.name).toBe("test-state");
    });

    it("should auto-generate name when not provided", () => {
      const state1 = createRequestState<string>();
      const state2 = createRequestState<string>();
      expect(state1.name).toMatch(/^state:\d+$/);
      expect(state2.name).toMatch(/^state:\d+$/);
      expect(state1.name).not.toBe(state2.name);
    });
  });
});
