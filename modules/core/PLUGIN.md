# PLUGIN AUTHORING GUIDE

A plugin is a named object with a `load()` function. Register it via `app.register()` before calling `app.ready()`.

```typescript
import { definePlugin, type Raven, type StateSetter } from "@raven.js/core";

export function myPlugin(config: { prefix: string }) {
  return definePlugin({
    name: "my-plugin",
    async load(app: Raven, set: StateSetter) {
      // register hooks, routes, write state
    },
  });
}

const app = new Raven();
app.register(myPlugin({ prefix: "/api" }));
const fetch = await app.ready();
```

**`definePlugin(plugin)`** — type helper only, no runtime effect.

**`StateSetter`** — scope-bound write function injected into `load()`. Signature: `set<T>(state: ScopedState<T>, value: T) => void`. Always writes to the scope determined at registration time (see below).

**`app.register(plugin, scopeKey?)`** — synchronous, queues the plugin. All queued plugins run in registration order during `await app.ready()`, each `load()` awaited serially.

**`app.use(plugin, scopeKey?)`** — async, runs `load()` **immediately**. Intended for use inside another plugin's `load()` to declare an inline dependency whose state is needed right away. See [Pattern 3](#pattern-3--plugin-owns-its-dependency).

**`app.onLoaded(hook)`** — registers a hook that runs during `ready()`, after all plugin loads complete.

---

# STATE PATTERNS

State ownership is the key design decision. Pick the pattern based on who holds and who reads the state.

## Pattern 1 — Plugin produces state

Define state descriptor(s) at module level and export them. In `load()`, write the value via `set()`.

As a plugin author, **you don't know which scope your plugin will run in** — that's decided by whoever calls `app.register()`. You don't need to think about it. `set()` is scope-transparent: it writes to whatever scope the caller assigned, and the exported descriptor is the read handle consumers use to get it back.

```typescript
// db-plugin.ts
import { definePlugin, defineAppState, type Raven, type StateSetter } from "@raven.js/core";

export interface DB {
  query(sql: string): Promise<unknown[]>;
}

export const DBState = defineAppState<DB>({ name: "db" });

export function dbPlugin(dsn: string) {
  return definePlugin({
    name: "db",
    async load(_app: Raven, set: StateSetter) {
      set(DBState, await connectDatabase(dsn)); // scope is up to the caller
    },
  });
}
```

The plugin code never changes — the caller decides how to register it:

```typescript
// Single instance — no scopeKey, state lands in GLOBAL scope
app.register(dbPlugin(dsn));
DBState.getOrFailed(); // reads GLOBAL scope ✓

// Multiple instances — caller names each scope
app.register(dbPlugin(primaryDsn), "primary");
app.register(dbPlugin(replicaDsn), "replica");
DBState.in("primary").getOrFailed();
DBState.in("replica").getOrFailed();
```

> `DBState.get()` always reads GLOBAL scope. If the plugin was registered with a `scopeKey`, reads must use `.in(scopeKey)` — the scope key is owned by the caller, not the plugin.

---

## Pattern 2 — Plugin reads state from another plugin

When a plugin needs to **read** state owned by another plugin, accept a `StateView<T>` as a factory parameter. The caller decides which scope to pass — the plugin stays fully decoupled from scope details.

```typescript
// auth-plugin.ts
import { definePlugin, type StateView, type Raven, type StateSetter } from "@raven.js/core";
import type { DB } from "./db-plugin.ts";

export function authPlugin(dbView: StateView<DB>) {
  return definePlugin({
    name: "auth",
    load(app: Raven, set: StateSetter) {
      app.beforeHandle(async () => {
        const db = dbView.getOrFailed(); // reads from whatever scope the caller bound
        // verify token against db...
      });
    },
  });
}
```

```typescript
// app.ts
import { dbPlugin, DBState } from "./db-plugin.ts";
import { authPlugin } from "./auth-plugin.ts";

app.register(dbPlugin("postgres://primary/db"), "primary");
app.register(authPlugin(DBState.in("primary"))); // caller picks the scope and wires it up
```

If `dbPlugin` is registered without a `scopeKey` (GLOBAL scope), just pass `DBState` directly — its `.get()` is already bound to GLOBAL:

```typescript
app.register(dbPlugin("postgres://host/db"));
app.register(authPlugin(DBState)); // DBState implements StateView<DB>
```

**When to use**: plugin reads (but does not write) state from another plugin. The caller wires up which instance to use.

---

## Pattern 3 — Plugin owns its dependency

When a plugin wants to **fully encapsulate** a dependency — hiding it as an internal implementation detail — use `app.use()` with a dynamically created `Symbol` scope key.

`app.use()` runs the dependency's `load()` immediately (unlike `app.register()` which defers it), so the dependency's state is available within the same `load()` phase.

Creating the `Symbol` inside `load()` gives each invocation its own unique scope, so multiple registrations of the parent plugin never interfere with each other.

```typescript
// auth-plugin.ts
import { definePlugin, type Raven, type StateSetter } from "@raven.js/core";
import { dbPlugin, DBState } from "./db-plugin.ts";

export function authPlugin(dsn: string) {
  return definePlugin({
    name: "auth",
    async load(app: Raven, set: StateSetter) {
      // Fresh Symbol per load() call — collision-free across multiple registrations
      const dbScope = Symbol("auth:db");

      await app.use(dbPlugin(dsn), dbScope); // runs dbPlugin immediately

      // State is available right now
      const db = DBState.in(dbScope).getOrFailed();

      app.get("/auth/check", async () => {
        // Closure captures dbScope — always reads this instance's own db
        const conn = DBState.in(dbScope).getOrFailed();
        // ...
      });
    },
  });
}
```

```typescript
// app.ts — two independent auth instances, each with their own db
app.register(authPlugin("postgres://tenant-a/db"));
app.register(authPlugin("postgres://tenant-b/db"));
```

Each registration's `load()` creates a new `Symbol`, so the two `DBState` values never overlap.

**When to use**: a plugin has its own internal dependency and wants to hide it from the caller.

### Multiple internal instances of the same dependency

Create a separate `Symbol` for each:

```typescript
async load(app: Raven, set: StateSetter) {
  const primaryScope = Symbol("auth:db-primary");
  const replicaScope = Symbol("auth:db-replica");

  await app.use(dbPlugin(primaryDsn), primaryScope);
  await app.use(dbPlugin(replicaDsn), replicaScope);

  const primary = DBState.in(primaryScope).getOrFailed();
  const replica = DBState.in(replicaScope).getOrFailed();

  app.get("/data", () => {
    const p = DBState.in(primaryScope).getOrFailed();
    const r = DBState.in(replicaScope).getOrFailed();
    // ...
  });
}
```

---

## Pattern 4 — Writing `RequestState` in hooks

`RequestState` is written per-request, not at registration time. Capture the `set` from `load()` in a closure and call it inside a `beforeHandle` or `onRequest` hook.

```typescript
// auth-plugin.ts
import {
  definePlugin,
  defineRequestState,
  HeadersState,
  type Raven,
  type StateSetter,
} from "@raven.js/core";

interface User {
  id: string;
  name: string;
}

export const CurrentUser = defineRequestState<User>({ name: "current-user" });

export function authPlugin() {
  return definePlugin({
    name: "auth",
    load(app: Raven, set: StateSetter) {
      app.beforeHandle(async () => {
        const headers = HeadersState.getOrFailed();
        const user = await verifyToken(headers["authorization"]);
        set(CurrentUser, user); // writes to request scope on every request
      });
    },
  });
}
```

```typescript
// any route handler
app.get("/me", () => {
  const user = CurrentUser.getOrFailed();
  return Response.json(user);
});
```

The `set` closure captures the scope key from `register()`. When called during a request, it writes to request-scoped storage under that scope — isolated to the current request's lifetime.

**When to use**: state that differs per request (authenticated user, parsed body, tenant context, etc.).

---

# GOTCHAS

## `app.register()` inside `load()` does not execute immediately

Calling `app.register()` inside a plugin's `load()` appends the new plugin to the pending queue — it runs _after_ the current plugin's `load()` finishes, not right away. Reading the dependency's state in the same `load()` call will fail.

```typescript
// ❌ Wrong: dbPlugin hasn't loaded yet
async load(app, set) {
  app.register(dbPlugin(dsn), "my-db");
  DBState.in("my-db").getOrFailed(); // throws — state not set
}

// ✓ Correct: app.use() runs immediately
async load(app, set) {
  const dbScope = Symbol("my-db");
  await app.use(dbPlugin(dsn), dbScope);
  DBState.in(dbScope).getOrFailed(); // safe
}
```

`app.register()` inside `load()` is fine if the dependency's state is only needed inside handlers (at request time), because all plugins will have loaded by then.

---

## `scopeKey` is for multiple instances, not for inter-plugin isolation

`scopeKey` exists to give independent state to multiple registrations of the **same plugin**. It is not a general isolation mechanism between different plugins.

State meant to be shared across the app — including state that other plugins read — should be written to GLOBAL scope (no `scopeKey`). Plugins that read it just call `state.get()` or accept a `StateView` parameter.

---

## Scoped reads must match the registered scope key

When a plugin is registered with a `scopeKey`, `set` writes to that named scope. `state.get()` reads GLOBAL scope only — it will return `undefined` if nothing was written there.

```typescript
app.register(dbPlugin("postgres://primary"), "primary");

// ❌ Wrong: reads GLOBAL scope — returns undefined
DBState.getOrFailed();

// ✓ Correct
DBState.in("primary").getOrFailed();
```

---

## Hook order follows registration order

Hooks added in `load()` are appended to the global hook list. Plugins registered first have their hooks run first.

```typescript
app.register(authPlugin()); // beforeHandle added first — runs first per request
app.register(loggerPlugin()); // beforeHandle added second — runs second
app.get("/", handler);
```

---

## `onLoaded` runs after all plugins, during `ready()`

`onLoaded` hooks run after all plugin `load()` calls complete, in registration order, each awaited serially. If one throws, the remaining hooks are skipped and `ready()` rejects.

```typescript
app.register(dbPlugin(dsn));
app.onLoaded(async (app) => {
  // all plugins are loaded; safe to run post-init tasks
  await runMigrations(DBState.getOrFailed());
});

const fetch = await app.ready();
```

---

## `load()` errors are wrapped with the plugin name

If `load()` throws, `ready()` rejects with a message in the form:

```
[my-plugin] Plugin load failed: connection refused
```

The original error is available as `error.cause`.
