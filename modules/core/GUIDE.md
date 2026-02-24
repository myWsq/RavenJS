# RavenJS Core — AI Agent Learning Guide

This guide tells an AI Agent how to learn the core module.

## What to Read (in order)

1. **README.md** — Overview, architecture, core concepts, design decisions
2. **index.ts** — Main implementation: `Raven`, `ScopedState`, hooks, routing
3. **router.ts** — Radix tree router
4. **standard-schema.ts** — Standard schema types

## Key Concepts

- **Raven**: Logic-layer app exposing `handle(request) => Promise<Response>`. Register routes with full paths.
- **ScopedState**: DI via AsyncLocalStorage — `AppState` (app-wide), `RequestState` (per-request)
- **Built-in states**: `RavenContext`, `ParamsState`, `QueryState`, `HeadersState`, `BodyState` — populated by the framework
- **Hooks**: `onRequest` → route match → `beforeHandle` → handler → `beforeResponse` → response; `onError` for errors
- **Plugin**: Function extending the app, registered via `app.register()`

## Import Paths

- Public API: `@ravenjs/core` or `@raven.js/core`
- When copied to user project: `from "../core"` or `from "./core"` (relative path after raven add)

## GOTCHAS

- `BodyState` holds parsed JSON only; other states hold strings
- Handlers receive no args; use `RavenContext.getOrFailed()` and state getters
- `beforeHandle` / `beforeResponse` are route-scoped; returning a Response short-circuits

## Minimal Example

```typescript
import { Raven } from "./core/index.ts";

const app = new Raven();
app.get("/", () => new Response("Hello"));
Bun.serve({ fetch: app.handle });
```

## USAGE EXAMPLES

See README.md sections: CORE CONCEPTS, USAGE EXAMPLES (if present).
