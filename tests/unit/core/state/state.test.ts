import { describe, it, expect } from "bun:test";
import {
  Raven,
  RavenContext,
  defineAppState,
  defineRequestState,
  currentAppStorage,
  type StateSetter,
} from "../../../../modules/core";

describe("Unified State Mount (AppState & RequestState)", () => {
  describe("RequestState", () => {
    it("should maintain isolation between concurrent requests", async () => {
      const RequestId = defineRequestState<string>({ name: "requestId" });
      const app = new Raven();

      let capturedSet!: StateSetter;
      app.register({
        name: "id-plugin",
        load(_a, set) {
          capturedSet = set;
          _a.beforeHandle(() => {
            // set in hook, will be called per-request
          });
        },
      });

      app.get("/id", () => new Response(RequestId.getOrFailed()));

      // Directly run concurrent requests, each sets their own RequestId
      const handleRequest = async (id: string) => {
        // Each handle() call gets its own requestStorage Map
        const app2 = new Raven();
        let innerSet!: StateSetter;
        app2.register({
          name: "id-plugin-2",
          load(_a, set) {
            innerSet = set;
            _a.beforeHandle(() => {
              innerSet(RequestId, id);
            });
          },
        });
        app2.get("/id", () => new Response(RequestId.getOrFailed()));
        const fetch = await app2.ready();
        const res = await fetch(new Request("http://localhost/id"));
        return res.text();
      };

      void capturedSet;
      const results = await Promise.all([
        handleRequest("req-1"),
        handleRequest("req-2"),
        handleRequest("req-3"),
      ]);

      expect(results).toEqual(["req-1", "req-2", "req-3"]);
    });

    it("should work with RavenContext in dispatchRequest", async () => {
      const app = new Raven();
      app.get("/test", () => {
        const ctx = RavenContext.getOrFailed();
        return new Response(ctx.url.pathname);
      });

      const fetch = await app.ready();
      const res = await fetch(new Request("http://localhost/test"));
      expect(await res.text()).toBe("/test");
    });
  });

  describe("AppState", () => {
    it("should isolate state between Raven instances", async () => {
      const Config = defineAppState<{ db: string }>({ name: "config" });
      const app1 = new Raven();
      const app2 = new Raven();

      app1.register({
        name: "config-plugin-1",
        load(_app, set) {
          set(Config, { db: "mysql" });
        },
      });

      app2.register({
        name: "config-plugin-2",
        load(_app, set) {
          set(Config, { db: "postgres" });
        },
      });

      await app1.ready();
      await app2.ready();

      await currentAppStorage.run(app1, () => {
        expect(Config.get()?.db).toBe("mysql");
      });

      await currentAppStorage.run(app2, () => {
        expect(Config.get()?.db).toBe("postgres");
      });
    });

    it("should support穿透 (AppState accessible in Request context)", async () => {
      const DB = defineAppState<string>({ name: "db" });
      const app = new Raven();

      app.register({
        name: "db-plugin",
        load(_a, set) {
          set(DB, "client-ready");
        },
      });

      app.get("/db", () => {
        return new Response(DB.getOrFailed());
      });

      const fetch = await app.ready();
      const res = await fetch(new Request("http://localhost/db"));
      expect(await res.text()).toBe("client-ready");
    });
  });

  describe("Scoped State via in()", () => {
    it("should isolate AppState across different scope keys", async () => {
      const DBState = defineAppState<string>({ name: "db-scope-test" });
      const app = new Raven();

      app.register({
        name: "sql-global",
        load(_a, set) {
          set(DBState, "db-global");
        },
      });
      app.register(
        {
          name: "sql-s1",
          load(_a, set) {
            set(DBState, "db-s1");
          },
        },
        "S1",
      );
      app.register(
        {
          name: "sql-s2",
          load(_a, set) {
            set(DBState, "db-s2");
          },
        },
        "S2",
      );

      await app.ready();

      await currentAppStorage.run(app, () => {
        expect(DBState.get()).toBe("db-global");
        expect(DBState.in("S1").get()).toBe("db-s1");
        expect(DBState.in("S2").get()).toBe("db-s2");
      });
    });

    it("should return the same object for the same scope key (reference equality)", () => {
      const DBState = defineAppState<string>({ name: "db-ref-eq" });
      expect(DBState.in("S1")).toBe(DBState.in("S1"));
      expect(DBState.in("S2")).toBe(DBState.in("S2"));
    });

    it("should isolate RequestState across scopes within the same request", async () => {
      const TxState = defineRequestState<string>({ name: "tx-scope-test" });
      const app = new Raven();

      let setS1!: StateSetter;
      let setS2!: StateSetter;

      app.register(
        {
          name: "sql-s1-req",
          load(_a, set) {
            setS1 = set;
          },
        },
        "S1",
      );
      app.register(
        {
          name: "sql-s2-req",
          load(_a, set) {
            setS2 = set;
          },
        },
        "S2",
      );

      app.get("/tx", () => {
        setS1(TxState, "tx-s1");
        setS2(TxState, "tx-s2");
        const s1 = TxState.in("S1").getOrFailed();
        const s2 = TxState.in("S2").getOrFailed();
        return new Response(`${s1}|${s2}`);
      });

      const fetch = await app.ready();
      const res = await fetch(new Request("http://localhost/tx"));
      expect(await res.text()).toBe("tx-s1|tx-s2");
    });

    it("should write RequestState via setter captured in beforeHandle hook", async () => {
      const UserState = defineRequestState<string>({ name: "user-hook-test" });
      const app = new Raven();

      app.register({
        name: "auth-plugin",
        load(_a, set) {
          _a.beforeHandle(() => {
            set(UserState, "alice");
          });
        },
      });

      app.get("/me", () => new Response(UserState.getOrFailed()));

      const fetch = await app.ready();
      const res = await fetch(new Request("http://localhost/me"));
      expect(await res.text()).toBe("alice");
    });
  });

  describe("Error Handling", () => {
    it("should return undefined when getting state without context", () => {
      const SomeState = defineAppState<string>({ name: "test" });
      expect(SomeState.get()).toBeUndefined();
    });

    it("should throw in getOrFailed when state is missing", async () => {
      const Required = defineAppState<string>({ name: "required" });
      const app = new Raven();
      await currentAppStorage.run(app, () => {
        expect(() => Required.getOrFailed()).toThrow(
          "State is not initialized. Cannot access state: required",
        );
      });
    });
  });

  describe("Object Parameter API", () => {
    it("should create state with object parameter", () => {
      const state = defineRequestState<string>({ name: "test-state" });
      expect(state.name).toBe("test-state");
    });

    it("should auto-generate name when not provided", () => {
      const state1 = defineRequestState<string>();
      const state2 = defineRequestState<string>();
      expect(state1.name).toMatch(/^state:\d+$/);
      expect(state2.name).toMatch(/^state:\d+$/);
      expect(state1.name).not.toBe(state2.name);
    });
  });
});
