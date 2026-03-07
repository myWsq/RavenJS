# OVERVIEW

RavenJS Core is a lightweight, high-performance Web framework reference implementation for Bun.

**Features**:

- Logic layer: `app.ready()` returns a `FetchHandler`
- Radix tree router (path parameters)
- Dependency injection (DI) via AsyncLocalStorage (ScopedState)
- Built-in Standard Schema request/response validation via `withSchema`
- Lifecycle hooks (onLoaded, onRequest, beforeHandle, beforeResponse, onError)
- Plugin system
- `SchemaClass` for schema-shape type inference

---

# SOURCE MAP

For AI-oriented reading, treat `core` as a set of concept modules instead of a single implementation file:

- `index.ts` — public export map
- `app/` — `Raven` public API, hook types, plugin-facing types
- `runtime/` — request dispatch, plugin loading, response handling, error flow
- `state/` — AsyncLocalStorage-backed state storage, descriptors, built-in states
- `schema/` — `withSchema`, validation, `SchemaClass`, Standard Schema contract
- `routing/` — radix router implementation
- `context/` — request context object
- `error/` — framework error model

Recommended code-reading order: `index.ts` → `app/raven.ts` → `runtime/dispatch-request.ts` → `state/` / `schema/` / `routing/`.

---

# READING PATHS

Use different reading paths depending on the job:

- **API / source path** — understand exports, runtime flow, and implementation boundaries: `index.ts` → `app/raven.ts` → `runtime/dispatch-request.ts` → `state/` / `schema/` / `routing/`
- **Business-code pattern path** — decide how to structure `interface`, `entity`, `repository`, `command`, `query`, `projection`, and `dto` files: [pattern/overview.md](./pattern/overview.md) → [pattern/layer-responsibilities.md](./pattern/layer-responsibilities.md) → [pattern/conventions.md](./pattern/conventions.md) → [pattern/anti-patterns.md](./pattern/anti-patterns.md)
- **Runtime-assembly pattern path** — wire `app.ts`, plugins, state, scopes, and hooks: [pattern/runtime-assembly.md](./pattern/runtime-assembly.md)
- **Plugin authoring details** — after the runtime-assembly path, read [PLUGIN.md](./PLUGIN.md) for plugin-specific API and gotchas
- **Review path** — before finishing a change, run through [pattern/anti-patterns.md](./pattern/anti-patterns.md)

Use the API / source path to understand what core exposes. Use the pattern paths to decide where new code belongs and how it should be organized.

---

# ARCHITECTURE

**Lifecycle overview**:

```
app setup (sync)
      │
      ▼
[plugin register]    ← app.register(plugin) — sync, queues plugins for loading.
      │
      ▼
await app.ready()    ← async build phase: runs plugin loads in order, then onLoaded hooks.
      │              ← returns a FetchHandler ready for Bun.serve.
      ▼
app ready
```

```
incoming request (each request)
      │
      ▼
[onRequest hooks]     ← global; receives raw Request. Returning a Response short-circuits.
      │
      ▼
[route matching]      ← no match → 404
      │
      ▼
[processStates]       ← parses request data, validates declared schemas, populates ParamsState / QueryState / HeadersState / BodyState
      │
      ▼
[beforeHandle hooks]  ← route-scoped; no args. Returning a Response short-circuits.
      │
      ▼
[handler()]           ← zero-arg handler, or typed schema handler registered through withSchema
      │
      ▼
[beforeResponse hooks] ← route-scoped; receives Response. Returning a new Response replaces it.
      │
      ▼
outgoing response

any uncaught exception → [onError hooks] → fallback 500
```

---

# CORE CONCEPTS

## Raven

The main application class. Register routes with full paths (e.g. `app.get('/api/v1/users', handler)`).
Raven is a **logic layer** — call `await app.ready()` to get a `FetchHandler`:

```typescript
const app = new Raven();
app.get("/", () => new Response("Hello"));

const fetch = await app.ready();
Bun.serve({ fetch });
```

Because Raven is a logic layer, you can combine it with [Bun's Fullstack Dev Server](https://bun.com/docs/bundler/fullstack.md) to serve HTML routes and bundled frontend assets alongside API routes:

```typescript
import { Raven } from "@raven.js/core";
import homepage from "./index.html";

const app = new Raven();
app.get("/api/hello", () => Response.json({ message: "Hello" }));

const fetch = await app.ready();
Bun.serve({
  routes: {
    "/": homepage,
    "/api/*": fetch,
  },
});
```

## Context

The per-request context object, exposing `request`, `params`, `query`, `url`, `method`, `headers`, and `body`.

Access it via the built-in `RavenContext` state:

```typescript
const ctx = RavenContext.getOrFailed();
console.log(ctx.method); // "GET"
console.log(ctx.params); // { id: "42" }
```

## Dependency Injection (DI)

**ScopedState is RavenJS's dependency injection (DI) implementation.** It uses `AsyncLocalStorage` to inject state into the async call chain, allowing handlers and hooks to access dependencies without explicit parameter passing. Each ScopedState is a state container with a well-defined lifetime:

| Type           | Lifetime                     | Typical use                          |
| -------------- | ---------------------------- | ------------------------------------ |
| `AppState`     | Shared across the entire app | DB connections, config, counters     |
| `RequestState` | Isolated per HTTP request    | Current user, parsed body, auth info |

**Built-in states** (populated automatically by the framework — do not set manually):

| State          | Type                     | Description                             |
| -------------- | ------------------------ | --------------------------------------- |
| `RavenContext` | `Context`                | Full request context                    |
| `ParamsState`  | `Record<string, string>` | URL path parameters                     |
| `QueryState`   | `Record<string, string>` | Query string parameters                 |
| `HeadersState` | `Record<string, string>` | Request headers (lowercased keys)       |
| `BodyState`    | `unknown`                | Request body (JSON only; cast required) |

For routes registered through `withSchema`, these states contain validated output values before `beforeHandle` runs. If you need the raw request, read `RavenContext.getOrFailed().request` directly.

## Schema Validation

Core includes Standard Schema-based request and response validation. Use `withSchema` to declare schemas for `body`, `query`, `params`, `headers`, and optionally `response`; Raven validates request schemas during `processStates`, writes validated output back into the built-in states, and passes a typed `ctx` object to your handler. If `response` is declared, the handler returns the response schema input type and core serializes the validated output with `Response.json(...)`. If the response schema does not match, Raven triggers `onResponseValidationError` and falls back to `Response.json(handlerReturnValue)` instead of failing the whole request. If `response` is omitted, the handler keeps returning `Response` as before.

```typescript
import { Raven, isValidationError, withSchema } from "@raven.js/core";
import { z } from "zod";

const app = new Raven();

app.post(
  "/users",
  withSchema(
    {
      body: z.object({
        name: z.string(),
      }),
      response: z.object({
        id: z.string().transform((value) => Number(value)),
        name: z.string(),
      }),
    },
    async (ctx) => ({
      id: "1",
      name: ctx.body.name,
    }),
  ),
);

app.onResponseValidationError(({ error, value }) => {
  console.error("Response schema mismatch", error.responseIssues, value);
});

app.onError((error) => {
  if (isValidationError(error)) {
    return Response.json({ issues: error.bodyIssues }, { status: 400 });
  }
});
```

`responseIssues` is primarily useful inside `onResponseValidationError`. Request-side validation failures still go through `onError` as before.

`SchemaClass(shape)` is also exported from core for DTO-style type inference. It exposes `_shape` on the class and instance, but does not perform runtime validation.

## Plugin

A plugin is a **named object** with a `load(app, set)` method, registered via `app.register()`. Plugins are created by factory functions so they can accept configuration.

`app.register()` is **synchronous** — it queues the plugin for loading. Plugins are loaded in registration order during `await app.ready()`, which awaits each `load()` serially. This means a later plugin's `load()` can safely read state written by an earlier plugin's async `load()`.

`app.register()` returns `this`, enabling **chained registration**:

```typescript
const fetch = await app
  .register(dbPlugin({ dsn: "postgres://..." }))
  .register(authPlugin())
  .ready();
```

The second argument to `load` is a **`StateSetter`** — a scope-bound function for writing state: `set(state, value)`. It captures the scope key provided at `register()` time, so writes always land in the correct scope.

`app.register()` accepts an optional `scopeKey` string to isolate state for that registration. Use this when registering the same plugin multiple times with independent state; read scoped values via `state.in(scopeKey)`.

`app.onLoaded(hook)` registers hooks that run during `ready()`, after all plugin loads complete. Use them for one-time initialization that shouldn't block plugin registration.

→ **Creating a plugin?** See [PLUGIN.md](./PLUGIN.md) for the full authoring guide and state patterns.

---

# DESIGN DECISIONS

## Why AsyncLocalStorage for state?

ScopedState uses AsyncLocalStorage as the underlying mechanism for DI. Compared to traditional DI containers or class decorators:

- **Async-safe**: state propagates automatically through the async call chain without cross-request leakage
- **Zero boilerplate**: handlers don't need to receive a context argument — dependencies are injected into the call chain automatically
- **Flexible access**: unlike decorators that bake dependencies into constructor or method signatures, you can obtain injected dependencies anywhere in the call chain, only when needed — no rigid injection points
- **High performance**: zero-copy access, lighter than decorators or full-featured DI containers

## Why are handlers zero-argument functions?

```typescript
type Handler = () => Response | Promise<Response>;
```

This is intentional:

- A handler only needs to return a `Response` — no framework-specific types required
- Data is accessed on demand via `BodyState.get()`, `RavenContext.getOrFailed()`, etc.
- Any plain function can be a handler with zero migration cost
- `withSchema` keeps the same route registration style while allowing typed handler context where needed

## Why is `register()` sync and `ready()` async?

Two distinct phases with different semantics:

- **`register()` (sync)**: declares structure — routes, hooks, and the plugin load queue. No I/O, no side effects. Immediately reflects in the app's route table and hook list.
- **`ready()` (async)**: runs all plugin `load()` functions serially (supporting async init like DB connections), then fires `onLoaded` hooks. Returns the `FetchHandler` when complete.

This separation means plugin B's `load()` can safely `await` async work and write state that plugin C's `load()` will read — serial ordering is guaranteed.

---

# GOTCHAS

## 1. Hooks are global once registered

```typescript
// Hooks apply to every matching request once registered
app.get("/users", handler);
app.beforeHandle(authHook);
```

Reason: hooks are evaluated during request dispatch, not snapshotted into individual routes. If a hook should only affect a subset of paths, check `RavenContext` or `request.url` inside the hook.

## 2. `register()` is sync — plugins load during `ready()`

`register()` only queues the plugin. The actual `load()` call happens inside `await app.ready()`. Always call `ready()` before serving traffic.

```typescript
// ❌ Wrong: load() hasn't run yet
app.register(myPlugin());
// state written by myPlugin is not available here

// ✓ Correct: wait for ready()
app.register(myPlugin());
const fetch = await app.ready();
// state is fully initialized
```

## 3. `StateSetter` only works inside an active context

`set(state, value)` (the `StateSetter` injected into `load()`) writes `AppState` values using `currentAppStorage`. It is only valid:

- during the `load(app, set)` call (for `AppState`)
- inside hooks or handlers that run within an active request context (for `RequestState` — use the captured `set` closure)

Calling it outside these locations has no effect or throws `ERR_STATE_CANNOT_SET`.

```typescript
const dbState = defineAppState<DB>({ name: "db" });

// ✓ Correct: write via set inside load()
app.register(
  definePlugin({
    name: "db",
    load(_app, set) {
      set(dbState, db);
    },
  }),
);
```

## 4. `BodyState` only parses JSON

The framework automatically parses the body and populates `BodyState` only when `Content-Type: application/json` is present. For all other content types (form-data, plain text, binary), `BodyState.get()` returns `undefined` — read the body manually via `RavenContext`.

```typescript
// Content-Type: application/json → populated automatically
const body = BodyState.getOrFailed() as { name: string };

// Content-Type: multipart/form-data → read manually
const ctx = RavenContext.getOrFailed();
const formData = await ctx.request.formData();
```

## 5. `BodyState` is typed `unknown` — cast required

`ParamsState`, `QueryState`, and `HeadersState` are typed as `Record<string, string>` and can be used directly. Only `BodyState` remains `unknown` because JSON structure is arbitrary.

```typescript
// ParamsState / QueryState / HeadersState — use directly, no cast needed
const { id } = ParamsState.getOrFailed();

// BodyState — cast required
const body = BodyState.getOrFailed() as { name: string };
```

## 6. Schema-aware routes write validated output back into State

When a route is registered with `withSchema`, the output of each schema is written into the built-in states before `beforeHandle` runs. This means transforms such as `z.string().transform(Number)` affect both `ctx.query` and `QueryState`.

```typescript
app.beforeHandle(() => {
  const query = QueryState.getOrFailed() as { page: number };
  console.log(query.page); // number
});
```

## 6. `onRequest` has a different signature from all other hooks

`onRequest` is the only hook that receives an argument — the raw `Request` object. At this point, `RavenContext`, `ParamsState`, and other states **are not yet initialized** (route matching hasn't happened).

```typescript
// onRequest: receives the raw Request
app.onRequest((request) => {
  // RavenContext is NOT set here — do not call RavenContext.get()
  const token = request.headers.get("authorization");
});

// beforeHandle: no args, all states are ready
app.beforeHandle(() => {
  const ctx = RavenContext.getOrFailed(); // ✓ safe
});
```

## 7. Register `onLoaded` before calling `ready()`

`onLoaded` hooks are registered on the app instance and run during `await app.ready()`. Register all plugins and `onLoaded` hooks before calling `ready()`.

```typescript
const app = new Raven();

app.register(authPlugin());
app.register(dbPlugin());

app.onLoaded(async () => {
  await warmupCaches();
});

const fetch = await app.ready();
Bun.serve({ fetch, port: 3000 });
```

---

# ANTI-PATTERNS

## Do not store request-scoped data in AppState

```typescript
const userState = defineAppState<User>({ name: "user" }); // ❌

// AppState is shared across the entire app — concurrent requests will overwrite each other
app.register(
  definePlugin({
    name: "bad-plugin",
    load(app, set) {
      app.beforeHandle(async () => {
        set(userState, await fetchUser()); // dangerous! concurrent requests corrupt this value
      });
    },
  }),
);

// ✓ Use RequestState instead
const userState = defineRequestState<User>({ name: "user" });
```

## Do not register route-specific hooks globally

```typescript
// ❌ Intended to only hook /api, but the hook applies to ALL routes
app.get("/api/users", handler);
app.beforeHandle(apiOnlyHook); // applies to all routes registered after this

// ✓ Use path checks inside the hook, or structure routes so hooks apply only where needed
app.beforeHandle(() => {
  const ctx = RavenContext.getOrFailed();
  if (!ctx.url.pathname.startsWith("/api")) return;
  return apiOnlyHook();
});
app.get("/api/users", handler);
```

## Do not forget to return a Response from `onError`

```typescript
// ❌ Missing return — the framework falls through to subsequent hooks or the default 500
app.onError((error) => {
  console.error(error);
  // no return!
});

// ✓ Always return a Response
app.onError((error) => {
  console.error(error);
  return new Response("Something went wrong", { status: 500 });
});
```

---

# USAGE EXAMPLES

## Minimal

```typescript
import { Raven } from "./index.ts";

const app = new Raven();
app.get("/", () => new Response("Hello, World!"));

Bun.serve({ fetch: await app.ready(), port: 3000 });
```

## Path parameters

```typescript
import { Raven, ParamsState } from "./index.ts";

const app = new Raven();

app.get("/user/:id", () => {
  const { id } = ParamsState.getOrFailed();
  return new Response(`User ID: ${id}`);
});
```

## Route prefix (use full paths)

```typescript
import { Raven } from "./index.ts";

const app = new Raven();

app.get("/api/v1/users", () => new Response("Users list"));
app.post("/api/v1/users", () => new Response("Create user", { status: 201 }));
```

## Auth middleware (hooks must come before routes)

```typescript
import { Raven, definePlugin, defineRequestState, RavenContext } from "./index.ts";

interface User {
  id: string;
  role: string;
}
const currentUser = defineRequestState<User>({ name: "currentUser" });

const app = new Raven();

// register auth plugin first (hooks apply to routes registered after)
app.register(
  definePlugin({
    name: "auth",
    load(app, set) {
      app.beforeHandle(async () => {
        const ctx = RavenContext.getOrFailed();
        const token = ctx.headers.get("authorization");
        if (!token) return new Response("Unauthorized", { status: 401 });
        set(currentUser, await verifyToken(token));
      });
    },
  }),
);

// then register routes
app.get("/profile", () => {
  const user = currentUser.getOrFailed();
  return Response.json({ id: user.id });
});

Bun.serve({ fetch: await app.ready(), port: 3000 });
```

## Error handling

```typescript
import { Raven, RavenError, isRavenError, ParamsState } from "./index.ts";

const app = new Raven();

app.onError((error) => {
  if (isRavenError(error)) {
    return error.toResponse(); // serializes to JSON using statusCode
  }
  console.error("Unexpected error:", error);
  return new Response("Internal Server Error", { status: 500 });
});

app.get("/items/:id", () => {
  const { id } = ParamsState.getOrFailed();
  if (!id.match(/^\d+$/)) {
    throw RavenError.ERR_BAD_REQUEST("id must be numeric");
  }
  return Response.json({ id });
});
```

## Mutating the response (beforeResponse hook)

```typescript
const app = new Raven();

app.beforeResponse((response) => {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set("Access-Control-Allow-Origin", "*");
  return newResponse;
});

app.get("/data", () => Response.json({ ok: true }));
```
