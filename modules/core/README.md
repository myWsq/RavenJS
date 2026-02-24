# OVERVIEW

RavenJS Core is a lightweight, high-performance Web framework reference implementation for Bun.

**Philosophy**: This is reference code, not an npm package to import. Copy it, modify it, learn from it, and use it directly in your project.

**Features**:

- HTTP server via Bun.serve
- Radix tree router (path parameters and route groups)
- Dependency injection (DI) via AsyncLocalStorage (ScopedState)
- Lifecycle hooks (onRequest, beforeHandle, beforeResponse, onError)
- Plugin system

---

# ARCHITECTURE

**Full request lifecycle**:

```
incoming request
      │
      ▼
[onRequest hooks]     ← global; receives raw Request. Returning a Response short-circuits.
      │
      ▼
[route matching]      ← no match → 404
      │
      ▼
[processStates]       ← populates ParamsState / QueryState / HeadersState / BodyState
      │
      ▼
[beforeHandle hooks]  ← route-scoped (includes parent hooks); no args. Returning a Response short-circuits.
      │
      ▼
[handler()]           ← no args; returns Response
      │
      ▼
[beforeResponse hooks] ← route-scoped (includes parent hooks); receives Response. Returning a new Response replaces it.
      │
      ▼
outgoing response

any uncaught exception → [onError hooks] → fallback 500
```

---

# CORE CONCEPTS

## Raven

The main application class. Each `group()` call creates a child `Raven` instance that shares the same `RadixRouter` but has its own independent hook list.

```typescript
const app = new Raven();
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

## Plugin

A function that extends a `Raven` instance, registered via `app.register()`. Calling `AppState.set()` is safe inside a plugin callback.

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

## Why is the hook pipeline snapshotted at route registration?

When `addRoute()` is called, it immediately calls `getAllHooks()` to collect all currently registered hooks and stores them in the route's `pipeline`. This means:

- **Hooks must be registered before routes** — hooks added after a route is registered will not apply to it
- Each route's pipeline is an independent snapshot and does not affect other routes

---

# GOTCHAS

## 1. Hooks must be declared before routes

```typescript
// ❌ Wrong: beforeHandle will NOT apply to /users
app.get("/users", handler);
app.beforeHandle(authHook);

// ✓ Correct: register hooks first, then routes
app.beforeHandle(authHook);
app.get("/users", handler);
```

Reason: `addRoute()` snapshots all current hooks at call time.

## 2. `group()` and `register()` are async — always await them

```typescript
// ❌ Wrong: routes inside the group may not be registered yet
app.group("/api", (api) => {
  api.get("/users", handler);
});
await app.listen({ port: 3000 }); // /api/users might not exist yet

// ✓ Correct
await app.group("/api", (api) => {
  api.get("/users", handler);
});
await app.listen({ port: 3000 });
```

## 3. `AppState.set()` only works inside an AppStorage context

`AppState.set()` depends on `currentAppStorage`. It is only valid inside:

- a `register()` plugin callback
- a `group()` callback
- a request handler (after `handleRequest` establishes the context)

Calling it outside these locations throws `ERR_STATE_CANNOT_SET`.

```typescript
const dbState = createAppState<DB>({ name: "db" });

// ❌ Wrong: called outside AppStorage context
dbState.set(db);

// ✓ Correct: called inside register()
await app.register((instance) => {
  dbState.set(db);
});
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

## 7. Route group hook scope

Hooks registered inside a `group()` only affect routes registered within that same group. They do not propagate upward to the parent. Parent hooks are inherited downward into child groups (the snapshot walk traverses the parent chain).

```typescript
await app.group("/admin", (admin) => {
  admin.beforeHandle(adminAuthHook); // only applies to /admin/* routes
  admin.get("/dashboard", handler);
});
app.get("/public", handler); // adminAuthHook does NOT apply here
```

---

# ANTI-PATTERNS

## Do not store request-scoped data in AppState

```typescript
const userState = createAppState<User>({ name: "user" }); // ❌

// AppState is shared across the entire app — concurrent requests will overwrite each other
app.beforeHandle(async () => {
  userState.set(await fetchUser()); // dangerous! concurrent requests corrupt this value
});

// ✓ Use RequestState instead
const userState = createRequestState<User>({ name: "user" });
```

## Do not register group-scoped hooks outside the group

```typescript
// ❌ Intended to only hook /api, but hooks are registered in the wrong place
await app.group("/api", (api) => {
  api.get("/users", handler);
});
app.beforeHandle(apiOnlyHook); // this will apply to ALL routes registered after this line, not just /api

// ✓ Register the hook inside the group
await app.group("/api", (api) => {
  api.beforeHandle(apiOnlyHook); // only applies to /api/* routes
  api.get("/users", handler);
});
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

await app.listen({ port: 3000 });
```

## Path parameters

```typescript
import { Raven, ParamsState } from "./index.ts";

const app = new Raven();

app.get("/user/:id", () => {
  const { id } = ParamsState.getOrFailed();
  return new Response(`User ID: ${id}`);
});

await app.listen({ port: 3000 });
```

## Route groups (remember to await)

```typescript
import { Raven } from "./index.ts";

const app = new Raven();

await app.group("/api/v1", (api) => {
  api.get("/users", () => new Response("Users list"));
  api.post("/users", () => new Response("Create user", { status: 201 }));
});

await app.listen({ port: 3000 });
```

## Auth middleware (hooks must come before routes)

```typescript
import { Raven, createRequestState, RavenContext } from "./index.ts";

interface User {
  id: string;
  role: string;
}
const currentUser = createRequestState<User>({ name: "currentUser" });

const app = new Raven();

// register hook first
app.beforeHandle(async () => {
  const ctx = RavenContext.getOrFailed();
  const token = ctx.headers.get("authorization");
  if (!token) return new Response("Unauthorized", { status: 401 });
  currentUser.set(await verifyToken(token));
});

// then register routes
app.get("/profile", () => {
  const user = currentUser.getOrFailed();
  return Response.json({ id: user.id });
});

await app.listen({ port: 3000 });
```

## App-level state via plugin

```typescript
import { Raven, createAppState, createPlugin } from "./index.ts";

interface DB {
  query: (sql: string) => Promise<unknown[]>;
}
const dbState = createAppState<DB>({ name: "db" });

const dbPlugin = createPlugin(async (app) => {
  const db = await connectDatabase();
  dbState.set(db); // ✓ inside register(), AppStorage context is active
});

const app = new Raven();
await app.register(dbPlugin);

app.get("/users", async () => {
  const db = dbState.getOrFailed();
  const users = await db.query("SELECT * FROM users");
  return Response.json(users);
});

await app.listen({ port: 3000 });
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

await app.listen({ port: 3000 });
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

await app.listen({ port: 3000 });
```
