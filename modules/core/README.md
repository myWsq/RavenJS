# OVERVIEW

RavenJS Core is a lightweight, high-performance Web framework reference implementation for Bun.

**Features**:
- Logic layer: `app.handle` (FetchHandler)
- Radix tree router (path parameters)
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
[beforeHandle hooks]  ← route-scoped; no args. Returning a Response short-circuits.
      │
      ▼
[handler()]           ← no args; returns Response
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
Raven is a **logic layer**—it exposes `handle(request) => Promise<Response>`:

```typescript
const app = new Raven();
app.get("/", () => new Response("Hello"));
Bun.serve({ fetch: (req) => app.handle(req) });
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

A plugin is a **named object** with a `load(app)` method, registered via `app.register()`. Plugins are created by factory functions so they can accept configuration. `app.register()` returns a `Promise` resolving to the plugin's `states` tuple — always `await` it.

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

## Why is the hook pipeline snapshotted at route registration?

When `addRoute()` is called, it snapshots all currently registered hooks and stores them in the route's `pipeline`. This means:

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

## 2. `register()` is async — always await it

`register()` returns `Promise<states>`, not `Promise<app>`. Always await and destructure the returned states if needed.

```typescript
// ❌ Wrong: plugin may not have run yet
app.register(myPlugin());

// ✓ Correct: await it
await app.register(myPlugin());

// ✓ Correct: destructure states when plugin declares them
const [configState] = await app.register(configPlugin({ dsn: "..." }));
```

## 3. `AppState.set()` only works inside an AppStorage context

`AppState.set()` depends on `currentAppStorage`. It is only valid inside:

- a plugin's `load(app)` callback
- a request handler (after `handle` establishes the context)

Calling it outside these locations throws `ERR_STATE_CANNOT_SET`.

```typescript
const dbState = createAppState<DB>({ name: "db" });

// ❌ Wrong: called outside AppStorage context
dbState.set(db);

// ✓ Correct: called inside plugin load()
await app.register(definePlugin({
  name: "db",
  states: [],
  load(app) {
    dbState.set(db);
  },
}));
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

## 7. Do not pass `app.handle` directly to `Bun.serve`

`handle` is a class method. Passing `app.handle` as the `fetch` callback loses the `this` context when Bun calls it, so `handle`'s internal use of `this` (e.g. for `currentAppStorage.run(this, ...)`) will break.

```typescript
// ❌ Wrong: this is lost when Bun invokes the callback
Bun.serve({ fetch: app.handle });

// ✓ Correct: wrap in an arrow function (or use app.handle.bind(app))
Bun.serve({ fetch: (req) => app.handle(req), port: 3000 });
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

Bun.serve({ fetch: (req) => app.handle(req), port: 3000 });
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
