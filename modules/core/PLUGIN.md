# PLUGIN AUTHORING GUIDE

A plugin is a **named object** returned by a factory function and registered via `app.register()`.

```typescript
import { definePlugin, type Raven } from "@raven.js/core";

export function myPlugin(config: { prefix: string }) {
  return definePlugin({
    name: "my-plugin",   // required — shown in error messages
    states: [],          // ScopedState instances created inside this factory
    load(app: Raven) {   // called during registration
      app.onRequest((req) => { /* ... */ });
    },
  });
}

const app = new Raven();
await app.register(myPlugin({ prefix: "/api" }));
```

**`definePlugin`** is a type helper — it ensures TypeScript infers `states` as a tuple rather than an array, which makes the return type of `register()` precise. It has no runtime effect.

---

# STATE PATTERNS

Plugins interact with the `ScopedState` DI system in two patterns. Choose based on who owns the state.

## Pattern A — Per-registration isolated states

Declare states **inside the factory function**. Each call to the factory creates a new state instance. `app.register()` returns these states — the caller destructures them.

```typescript
// config-plugin.ts
import { definePlugin, createAppState, type Raven } from "@raven.js/core";

interface Config { value: string }

export function configPlugin(value: string) {
  const ConfigState = createAppState<Config>();  // new instance per factory call
  return definePlugin({
    name: "config-plugin",
    states: [ConfigState] as const,
    load(app: Raven) {
      ConfigState.set({ value });
    },
  });
}
```

```typescript
// app.ts
import { configPlugin } from "./config-plugin.ts";

const app = new Raven();
const [primaryConfig]   = await app.register(configPlugin("primary-value"));
const [secondaryConfig] = await app.register(configPlugin("secondary-value"));

app.get("/", () => {
  const a = primaryConfig.getOrFailed();
  const b = secondaryConfig.getOrFailed();
  return Response.json({ a: a.value, b: b.value });
});
```

**When to use**: any plugin that owns its state — whether registered once or multiple times. Each registration holds independent state; the caller gets it back from `register()`.

> **Note**: `as const` on the `states` array is required to help TypeScript infer a tuple type, so the destructured value from `register()` is typed correctly.

---

## Pattern B — Caller-provided state (inter-plugin dependency)

Accept a `ScopedState` instance as a parameter. The caller creates and owns the state; the plugin only writes to it. This is the standard way for one plugin to depend on another.

```typescript
// logger-plugin.ts
import { definePlugin, type AppState, type Raven } from "@raven.js/core";

interface Logger { log: (msg: string) => void }

export function loggerPlugin(loggerState: AppState<Logger>) {
  return definePlugin({
    name: "logger-plugin",
    states: [],
    load(app: Raven) {
      loggerState.set({ log: (msg) => console.log(msg) });
    },
  });
}
```

```typescript
// app.ts
import { loggerPlugin } from "./logger-plugin.ts";
import { createAppState } from "@raven.js/core";

interface Logger { log: (msg: string) => void }

const loggerState = createAppState<Logger>();

const app = new Raven();
await app.register(loggerPlugin(loggerState));

// pass loggerState to any other plugin that needs it
await app.register(someOtherPlugin(loggerState));
```

**When to use**: a plugin depends on state owned by another plugin, or the caller needs explicit control over the state's identity and lifecycle.

---

# GOTCHAS

## Do not declare state outside the factory

States declared at module level are shared across all `Raven` instances in the same process. This breaks test isolation and makes it impossible to register the same plugin more than once with independent state.

```typescript
// ❌ Wrong: shared across all app instances
export const DbState = createAppState<DB>();

export function dbPlugin(dsn: string) {
  return definePlugin({
    name: "db-plugin",
    states: [],
    async load() { DbState.set(await connectDatabase(dsn)); },
  });
}
```

```typescript
// ✓ Correct: one state instance per registration
export function dbPlugin(dsn: string) {
  const DbState = createAppState<DB>();
  return definePlugin({
    name: "db-plugin",
    states: [DbState] as const,
    async load() { DbState.set(await connectDatabase(dsn)); },
  });
}

// app.ts
export const [DbState] = await app.register(dbPlugin("postgres://localhost/mydb"));
```

---

## `register()` must be awaited

`register()` returns `Promise<states>`. Not awaiting it means `load()` may not have run before you register routes or subsequent plugins.

```typescript
// ❌ Wrong
app.register(myPlugin());
app.get("/", handler);   // load() may not have run yet

// ✓ Correct
await app.register(myPlugin());
app.get("/", handler);
```

## `AppState.set()` requires AppStorage context

`AppState.set()` only works when `currentAppStorage` is active. Inside `load()` this is always the case. Outside of `load()` (e.g. at module top level) it throws `ERR_STATE_CANNOT_SET`.

```typescript
const dbState = createAppState<DB>();

// ❌ Wrong: outside any context
dbState.set(db);

// ✓ Correct: inside load()
export function myPlugin() {
  return definePlugin({
    name: "my-plugin",
    states: [],
    load(app) {
      dbState.set(db);   // ✓ safe
    },
  });
}
```

## Hooks registered in `load()` apply in registration order

Hooks added in `load()` are appended to the global hook list. Plugins registered first have their hooks run first. Register plugins before routes to ensure hooks apply to all routes.

```typescript
await app.register(authPlugin());    // onRequest hook added first
await app.register(loggerPlugin());  // onRequest hook added second

app.get("/", handler);               // both hooks apply to this route
```

## `load()` errors are attributed to the plugin

If `load()` throws, the error message is wrapped with the plugin name:

```
[my-plugin] Plugin load failed: connection refused
```

The original error is available as `error.cause`.
