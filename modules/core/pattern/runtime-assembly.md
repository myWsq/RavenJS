# Runtime Assembly

Read the [overview](./overview.md) first if you want the high-level pattern before the RavenJS-specific runtime rules.

This document covers the part of the pattern that should know RavenJS deeply: plugins, state, hooks, and app composition.

State stays in this document because it is part of RavenJS runtime assembly, not a separate architectural layer.

## Runtime Assembly

This is the RavenJS-specific layer.

It owns:

- app composition
- direct route registration
- plugin registration for reusable runtime concerns
- state declaration colocated with plugins
- lifecycle hook placement
- error-to-response mapping

This layer is the only place that should deeply know RavenJS.

## State Rules

RavenJS introduces runtime state. Use it carefully.

### `AppState`

Use `AppState` only for long-lived runtime dependencies:

- database client
- config
- cache client
- mailer
- feature flags

Do not use `AppState` as a business model store.

### `RequestState`

Use `RequestState` only for per-request derived context:

- current user
- tenant
- transaction
- trace id
- permission snapshot

Do not store persistent business data in `RequestState`.

### Declaration Rules

In RavenJS, `State` should normally be declared together with the plugin that writes it.

Why:

- only plugins actually register and initialize runtime state
- only plugin `load()` has the framework-supported write path through `set(...)`
- colocating declaration and write ownership makes scope and lifecycle obvious

Recommended pattern:

```ts
// database.plugin.ts
const DBState = defineAppState<Bun.SQL>({ name: "db" });

function databasePlugin(config: Bun.SQL.Options) {
  return definePlugin({
    name: "database",
    load(_app, set) {
      set(DBState, new Bun.SQL(config));
    },
  });
}

export { DBState, databasePlugin };
```

```ts
// auth.plugin.ts
const CurrentUserState = defineRequestState<User>({ name: "current-user" });

function authPlugin() {
  return definePlugin({
    name: "auth",
    load(app, set) {
      app.beforeHandle(async () => {
        const token = HeadersState.getOrFailed().authorization;
        const user = await resolveCurrentUser(token);
        set(CurrentUserState, user);
      });
    },
  });
}

export { CurrentUserState, authPlugin };
```

Do not create a standalone `raven/state/` directory by default.

### What Can Be Declared Separately?

Usually not `State` itself.

The thing that is sometimes worth declaring separately is a shared `ScopeKey`.

Keep all shared scope keys in one file when you need them:

```ts
// scopes.ts
const ANALYTICS_DB = Symbol("analytics-db");

export const ScopeKeys = { ANALYTICS_DB } as const;
```

```ts
// app.ts
app.register(databasePlugin(analyticsConfig), ScopeKeys.ANALYTICS_DB);
```

```ts
// reporting.plugin.ts
const sql = DBState.in(ScopeKeys.ANALYTICS_DB).getOrFailed();
```

If a scope key is only used inside one plugin, keep it inline instead of extracting it.

### Preferred Access Pattern

At Raven runtime, dependency injection should primarily happen through `State`.

Use this split:

1. `AppState` for shared runtime dependencies such as database clients
2. `RequestState` for per-request derived context
3. plain constructor params only inside pure object construction

This keeps Raven's DI model consistent while still allowing entity objects to stay plain.

### Scope Rules

When a dependency has multiple runtime instances:

- use `register(plugin, scopeKey)`
- read with `State.in(scopeKey)`

When a dependency is private to a plugin:

- use `app.use()` with a private `Symbol` scope

This matches Raven's existing plugin and state patterns.

## Runtime Registration

In RavenJS, runtime assembly should usually happen in `src/raven/app.ts`.

Use this split:

- register routes directly in `app.ts`
- use plugins for reusable runtime concerns
- register global `onError` handling in `app.ts` or a small reusable plugin
- register `onResponseValidationError` when response schema mismatch should produce logs, metrics, or alerts
- keep feature code in `interface/`, not hidden behind route plugins by default

In practice, plugins here usually do one of two things:

- provide shared infra through `AppState`
- write per-request context through `RequestState`

Route handlers do not need to be wrapped in plugins by default.

Register them directly in `src/raven/app.ts` unless there is a concrete reason to hide route registration behind a plugin.

## Lifecycle Placement Rules

| Lifecycle        | Put Here                                                               | Do Not Put Here                                                  |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `onRequest`      | logging, trace id, raw request guard, CORS, cheap rate limit           | logic that depends on route params, parsed body, validated input |
| `beforeHandle`   | auth, tenant resolution, transaction open, permission snapshot         | DTO mapping, entity construction, response shaping               |
| `handler`        | input-to-entity orchestration, command calls, query calls, DTO mapping | generic cross-cutting concerns shared by many routes             |
| `beforeResponse` | response headers, envelope, tracing headers                            | business decisions that should have happened earlier             |
| `onError`        | validation error mapping, business error mapping, fallback response    | core business logic                                              |
| `onLoaded`       | one-time startup checks and initialization                             | per-request logic                                                |

Important RavenJS constraint:

- if logic needs route `params`, `query`, or parsed `body`, prefer `beforeHandle`
- `onRequest` runs before full route context is assembled

## Composition Root Pattern

`src/raven/app.ts` should be the single composition root.

It should:

1. create the Raven app
2. register infra plugins
3. register context plugins
4. register routes directly
5. register global error mapping
6. export `await app.ready()`

Example shape:

```ts
const app = new Raven();

app.register(databasePlugin(process.env.DATABASE_URL!));
app.register(authPlugin());
app.register(errorPlugin());

app.onResponseValidationError(({ error, value }) => {
  console.error("Response schema mismatch", error.responseIssues, value);
});

app.post("/orders", CreateOrderInterface.handler);
app.get("/orders/:id", GetOrderInterface.handler);

const fetch = await app.ready();

export { fetch };
```

This keeps framework assembly out of entity code and out of interface folders.

This is the default RavenJS style for this pattern:

- routes are visible in one place
- runtime concerns are still modular through plugins
- business code stays outside `app.ts`
