import { describe, expect, it, mock } from "bun:test";
import {
  Raven,
  defineAppState,
  currentAppStorage,
  definePlugin,
  type StateSetter,
} from "../../../../modules/core";

describe("Plugin System", () => {
  it("should register a plugin and call load after build()", async () => {
    const raven = new Raven();
    const load = mock((app: Raven, _set: StateSetter) => {
      app.onRequest(() => {});
    });

    raven.register(definePlugin({ name: "test-plugin", load }));
    expect(load).not.toHaveBeenCalled();

    await raven.ready();
    expect(load).toHaveBeenCalledWith(raven, expect.any(Function));
  });

  it("should support async plugin load", async () => {
    const raven = new Raven();
    let initialized = false;
    const ConfigState = defineAppState<string>();

    raven.register(
      definePlugin({
        name: "async-plugin",
        async load(_app, set) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          set(ConfigState, "ready");
          initialized = true;
        },
      }),
    );

    await raven.ready();
    expect(initialized).toBe(true);
    currentAppStorage.run(raven, () => {
      expect(ConfigState.getOrFailed()).toBe("ready");
    });
  });

  it("should run plugin loads in order so later plugins see earlier plugins' state", async () => {
    const raven = new Raven();
    const DbState = defineAppState<string>();
    let seenDb: string | undefined;

    raven
      .register(
        definePlugin({
          name: "db-plugin",
          async load(_app, set) {
            await new Promise((resolve) => setTimeout(resolve, 5));
            set(DbState, "connected");
          },
        }),
      )
      .register(
        definePlugin({
          name: "user-plugin",
          load(_app, _set) {
            seenDb = DbState.get();
          },
        }),
      );

    await raven.ready();
    expect(seenDb).toBe("connected");
  });

  it("should register hooks on the main instance after build()", async () => {
    const raven = new Raven();
    const hook = () => {};
    const plugin = definePlugin({
      name: "hooks-plugin",
      load(app: Raven, _set: StateSetter) {
        app.onRequest(hook);
      },
    });

    raven.register(plugin);
    await raven.ready();
    // @ts-expect-error - accessing private hooks for testing
    expect(raven.hooks.onRequest).toContain(hook);
  });

  it("should write AppState via set parameter and read it back", async () => {
    const raven = new Raven();
    const ConfigState = defineAppState<{ value: string }>();

    const plugin = definePlugin({
      name: "state-plugin",
      load(_app: Raven, set: StateSetter) {
        set(ConfigState, { value: "ok" });
      },
    });

    raven.register(plugin);
    await raven.ready();
    currentAppStorage.run(raven, () => {
      expect(ConfigState.getOrFailed().value).toBe("ok");
    });
  });

  it("should create a plugin using factory pattern", async () => {
    const raven = new Raven();
    interface MyOptions {
      foo: string;
    }
    const myPlugin = (opts: MyOptions) =>
      definePlugin({
        name: "my-plugin",
        load(_app: Raven, _set: StateSetter) {
          expect(opts.foo).toBe("bar");
        },
      });

    raven.register(myPlugin({ foo: "bar" }));
    await raven.ready();
  });

  it("should run onLoaded hooks once after plugins are registered", async () => {
    const raven = new Raven();
    const executionOrder: string[] = [];

    raven.register(
      definePlugin({
        name: "plugin-a",
        load(_app, _set) {
          executionOrder.push("plugin-a:load");
        },
      }),
    );
    raven.register(
      definePlugin({
        name: "plugin-b",
        load(_app, _set) {
          executionOrder.push("plugin-b:load");
        },
      }),
    );

    raven.onLoaded(async (app) => {
      expect(app).toBe(raven);
      executionOrder.push("onLoaded:1");
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    raven.onLoaded(() => {
      executionOrder.push("onLoaded:2");
    });
    raven.get("/", () => new Response("ok"));

    const fetch = await raven.ready();
    await fetch(new Request("http://localhost/"));
    await fetch(new Request("http://localhost/"));

    expect(executionOrder).toEqual(["plugin-a:load", "plugin-b:load", "onLoaded:1", "onLoaded:2"]);
  });

  it("should stop onLoaded chain and propagate errors", async () => {
    const raven = new Raven();
    const executionOrder: string[] = [];

    raven.register(
      definePlugin({
        name: "plugin-a",
        load(_app, _set) {},
      }),
    );

    raven.onLoaded(() => {
      executionOrder.push("onLoaded:1");
      throw new Error("onLoaded failed");
    });
    raven.onLoaded(() => {
      executionOrder.push("onLoaded:2");
    });
    raven.get("/", () => new Response("ok"));

    await expect(raven.ready()).rejects.toThrow("onLoaded failed");
    expect(executionOrder).toEqual(["onLoaded:1"]);
  });

  it("should isolate AppState between two registrations with different scope keys", async () => {
    const raven = new Raven();
    const DBState = defineAppState<string>({ name: "db-plugin-scope" });

    raven.register({
      name: "sql-global",
      load(_a, set) {
        set(DBState, "db-global");
      },
    });
    raven.register(
      {
        name: "sql-s1",
        load(_a, set) {
          set(DBState, "db-s1");
        },
      },
      "S1",
    );
    await raven.ready();

    currentAppStorage.run(raven, () => {
      expect(DBState.get()).toBe("db-global");
      expect(DBState.in("S1").get()).toBe("db-s1");
    });
  });

  it("should wrap plugin load errors with plugin name", async () => {
    const raven = new Raven();
    const plugin = definePlugin({
      name: "broken-plugin",
      load() {
        throw new Error("connection refused");
      },
    });

    raven.register(plugin);
    await expect(raven.ready()).rejects.toThrow(
      "[broken-plugin] Plugin load failed: connection refused",
    );
  });
});
