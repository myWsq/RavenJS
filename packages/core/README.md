# RavenJS Core

A lightweight, high-performance web framework designed for Bun and Node.js.

## Overview

RavenJS provides a unified HTTP server API that automatically adapts to Bun and Node.js runtimes. It features a Radix tree-based routing system, scoped state management, lifecycle hooks, and a plugin system.

### Core Features

- **HTTP Server**: Unified server startup API with automatic Bun/Node.js adaptation
- **Routing**: Radix tree routing with path parameters and route groups
- **State Management**: AppState (application-level) and RequestState (request-level)
- **Lifecycle Hooks**: onRequest, beforeHandle, beforeResponse, onError
- **Plugin System**: Extensible middleware mechanism

### Use Cases

- Building RESTful APIs
- Microservice backends
- Web server applications
- High-performance HTTP services

### Core Concepts

| Concept | Description |
|---------|-------------|
| `Raven` | Main application class for creating and managing servers |
| `Context` | Request context containing request, params, query, etc. |
| `ScopedState` | Scoped state for sharing data across async boundaries |
| `Plugin` | Plugin function to extend framework capabilities |

---

## Quick Start

### Minimal Example

```typescript
import { Raven } from "./src/raven/index.ts";

const app = new Raven();

app.get("/", () => {
  return new Response("Hello, World!");
});

app.listen({ port: 3000 });
```

### Route with Parameters

```typescript
import { Raven } from "./src/raven/index.ts";

const app = new Raven();

app.get("/user/:id", (ctx) => {
  return new Response(`User ID: ${ctx.params.id}`);
});

app.listen({ port: 3000 });
```

### Route Groups

```typescript
import { Raven } from "./src/raven/index.ts";

const app = new Raven();

app.group("/api", (api) => {
  api.get("/users", () => new Response("Users list"));
  api.post("/users", () => new Response("Create user"));
});

app.listen({ port: 3000 });
```

---

## API Reference

### Core Classes

#### `new Raven(options?)`

Creates a new Raven application instance.

```typescript
interface RavenOptions {
  prefix?: string;   // Route prefix
  parent?: Raven;   // Parent instance (for route groups)
}

const app = new Raven({ prefix: "/api" });
```

#### `app.listen(config)`

Starts the HTTP server.

```typescript
interface ServerConfig {
  port: number;
  hostname?: string;
}

await app.listen({ port: 3000 });
await app.listen({ port: 3000, hostname: "localhost" });
```

#### `app.stop()`

Stops the server.

```typescript
await app.stop();
```

### HTTP Methods

| Method | Description |
|--------|-------------|
| `app.get(path, handler)` | Register GET route |
| `app.post(path, handler)` | Register POST route |
| `app.put(path, handler)` | Register PUT route |
| `app.delete(path, handler)` | Register DELETE route |
| `app.patch(path, handler)` | Register PATCH route |

```typescript
app.get("/users", () => new Response("GET users"));
app.post("/users", () => new Response("POST users"));
app.put("/users/:id", () => new Response("PUT user"));
app.delete("/users/:id", () => new Response("DELETE user"));
```

### Handler

A handler is a function that returns `Response` or `Promise<Response>`.

```typescript
type Handler = () => Response | Promise<Response>;
```

Handler can receive a `Context` parameter:

```typescript
app.get("/user/:id", (ctx) => {
  const userId = ctx.params.id;
  const query = ctx.query;
  return new Response(`User: ${userId}`);
});
```

### Context

The request context object.

```typescript
class Context {
  readonly request: Request;
  readonly params: Record<string, string>;
  readonly query: Record<string, string>;
  readonly url: URL;
  readonly method: string;
  readonly headers: Headers;
  readonly body: ReadableStream<Uint8Array> | null;
}
```

### Lifecycle Hooks

#### `app.onRequest(hook)`

Executes before request processing begins.

```typescript
app.onRequest((request) => {
  console.log("Request:", request.url);
  // Returning a Response will short-circuit subsequent processing
});
```

#### `app.beforeHandle(hook)`

Executes before the Handler runs.

```typescript
app.beforeHandle(() => {
  // Validation logic
  // Returning a Response will skip the Handler
});
```

#### `app.beforeResponse(hook)`

Executes before the response is sent.

```typescript
app.beforeResponse((response) => {
  response.headers.set("X-Custom", "value");
  return response;
});
```

#### `app.onError(hook)`

Executes when an error occurs.

```typescript
app.onError((error) => {
  console.error("Error:", error);
  return new Response("Internal Error", { status: 500 });
});
```

### Route Groups

#### `app.group(prefix, callback)`

Creates a route group with accumulated prefix.

```typescript
app.group("/api", (api) => {
  api.group("/v1", (v1) => {
    v1.get("/users", () => new Response("users"));
  });
});
// Matches /api/v1/users
```

### State Management

#### `createAppState<T>(options?)`

Creates application-level state shared across the entire application.

```typescript
const counterState = createAppState<number>({ name: "counter" });

// Set value
counterState.set(0);

// Get value
const count = counterState.get();
const countOrFail = counterState.getOrFailed();
```

#### `createRequestState<T>(options?)`

Creates request-level state, unique to each request.

```typescript
const userState = createRequestState<User>({ name: "user" });

// Set in beforeHandle
app.beforeHandle(() => {
  userState.set(await fetchUser());
});

// Get in Handler
app.get("/profile", () => {
  const user = userState.getOrFailed();
  return new Response(user.name);
});
```

#### Predefined States

Framework-built-in states:

```typescript
BodyState    // Request body (parsed JSON)
QueryState   // Query parameters
ParamsState  // Path parameters
HeadersState // Request headers
```

```typescript
app.post("/submit", () => {
  const body = BodyState.getOrFailed();
  const query = QueryState.getOrFailed();
  return new Response(JSON.stringify({ body, query }));
});
```

### Plugin System

#### `createPlugin(pluginFn)`

Creates a plugin.

```typescript
import { createPlugin } from "./src/raven/index.ts";

const loggerPlugin = createPlugin((app) => {
  app.onRequest((req) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  });
});

await app.register(loggerPlugin);
```

### Error Handling

#### `RavenError`

Framework built-in error class.

```typescript
import { RavenError } from "./src/raven/index.ts";

throw RavenError.ERR_VALIDATION("Invalid input");
throw RavenError.ERR_BAD_REQUEST("Missing required field");

// Custom error
const error = new RavenError("ERR_CUSTOM", "Custom error", {}, 400);
```

Error methods:

```typescript
error.setContext({ key: "value" });
error.toResponse(); // Convert to Response
```

#### `isRavenError(value)`

Type guard.

```typescript
import { isRavenError } from "./src/raven/index.ts";

if (isRavenError(error)) {
  console.log(error.code, error.statusCode);
}
```

---

## Examples

### Complete REST API Example

```typescript
import { Raven, createAppState, createRequestState, RavenError } from "./src/raven/index.ts";

const app = new Raven();

// Simulated database
const users = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" }
];
const idCounter = createAppState<number>({ name: "idCounter" });
idCounter.set(2);

// Error handling
app.onError((error) => {
  if (RavenError.isRavenError(error)) {
    return error.toResponse();
  }
  return new Response(String(error), { status: 500 });
});

// GET /users - Get all users
app.get("/users", () => {
  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" }
  });
});

// GET /users/:id - Get single user
app.get("/users/:id", (ctx) => {
  const user = users.find(u => u.id === ctx.params.id);
  if (!user) {
    throw RavenError.ERR_VALIDATION("User not found");
  }
  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" }
  });
});

// POST /users - Create user
app.post("/users", (ctx) => {
  const id = String(idCounter.getOrFailed() + 1);
  idCounter.set(Number(id));
  const newUser = { id, name: "New User" };
  users.push(newUser);
  return new Response(JSON.stringify(newUser), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
});

app.listen({ port: 3000 });
```

### Using Plugins Example

```typescript
import { Raven, createPlugin } from "./src/raven/index.ts";

const app = new Raven();

// CORS plugin
const corsPlugin = createPlugin((app) => {
  app.beforeResponse((response) => {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    return response;
  });
  
  app.onRequest((request) => {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        }
      });
    }
  });
});

await app.register(corsPlugin);

app.get("/api/data", () => {
  return new Response(JSON.stringify({ message: "Hello" }));
});

app.listen({ port: 3000 });
```

### Route Groups Example

```typescript
import { Raven } from "./src/raven/index.ts";

const app = new Raven();

app.group("/api", (api) => {
  // /api/users
  api.get("/users", () => new Response("Users"));
  
  // /api/posts
  api.get("/posts", () => new Response("Posts"));
  
  // Nested route group
  api.group("/admin", (admin) => {
    admin.get("/dashboard", () => new Response("Admin Dashboard"));
  });
});

app.listen({ port: 3000 });
// Available routes: GET /api/users, GET /api/posts, GET /api/admin/dashboard
```

---

## Design Intent

### Why AsyncLocalStorage?

RavenJS uses `AsyncLocalStorage` for state management because:

1. **Async-safe**: State automatically propagates through the async call chain
2. **No boilerplate**: No need to manually pass context
3. **High performance**: Zero-copy access, lighter than decorators or DI

### Why Handler Doesn't Automatically Receive Context?

Handler is designed as a parameterless function because:

1. **Simplicity**: Just return `Response`, no need to understand framework-specific types
2. **Flexibility**: Users can use plain functions without learning new paradigms
3. **Accessible via State**: Access via `BodyState.get()` etc. when needed

Access Context via `RavenContext.getOrFailed()` if needed.

### Routing System Design

Using Radix tree (compressed prefix tree):

1. **High performance**: Lookup complexity O(k), where k is the number of path segments
2. **Memory efficiency**: Paths with shared prefixes are stored only once
3. **Supports parameters**: Natural `:id` parameter extraction

### Runtime Adaptation

`BunAdapter` and `NodeAdapter` abstract runtime differences:

- Bun: Uses native `Bun.serve()`
- Node.js: Uses `node:http`

Users don't need to care about the underlying implementation; the framework automatically selects the appropriate adapter.

---

## Caveats

### Reading Request Body

- Request body can only be read once. If needed in multiple places, read first and store in State
- JSON request body is automatically parsed

```typescript
// Correct
app.beforeHandle(() => {
  const body = BodyState.getOrFailed();
  // Use body
});

app.post("/data", () => {
  // Can also access in Handler
  const body = BodyState.getOrFailed();
  return new Response("OK");
});
```

### State Access

- `AppState` can be accessed anywhere
- `RequestState`, `BodyState` etc. must be accessed during request processing (after router match)

### Route Matching Order

- Exact paths take priority over parameter paths
- Parameter paths match in registration order

```typescript
app.get("/user/:id", () => new Response("param"));
app.get("/user/admin", () => new Response("exact")); // This will match /user/admin
```

### Lifecycle Hook Execution Order

1. Global `onRequest`
2. Route match
3. Route-level `beforeHandle`
4. Handler
5. Route-level `beforeResponse`
6. Global `beforeResponse`

### Server Can Only Start Once

Calling `listen()` more than once on the same Raven instance throws `ERR_SERVER_ALREADY_RUNNING` error.

### Bun vs Node.js Differences

| Feature | Bun | Node.js |
|---------|-----|---------|
| Default hostname | 0.0.0.0 | 0.0.0.0 |
| JSON parsing | Native support | Manual |
| File uploads | Native support | Need to handle streams |
