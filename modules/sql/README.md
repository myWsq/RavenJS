# OVERVIEW

@raven.js/sql is a RavenJS plugin that wraps [Bun's native SQL bindings](https://bun.com/docs/runtime/sql), exposing a single `Bun.SQL` client via the framework's dependency injection (AppState).

**Features**:
- **Unified API**: One client for PostgreSQL, MySQL, or SQLite using the same tagged template literal interface.
- **DI Integration**: The SQL client is stored in AppState; handlers obtain it via the state returned from `register()`.
- **Multiple clients**: Register the plugin multiple times for different databases; each registration gets its own state and connection pool.
- **Zero Boilerplate**: No manual client creation in handlers — use the injected client with `` sql`SELECT ...` ``.

---

# ARCHITECTURE

**Plugin lifecycle**:

```
app.register(sqlPlugin(config))
      │
      ▼
[load()]              ← Creates new Bun.SQL(config), sets on ClientState
      │
      ▼
register() resolves   ← Returns [ClientState] to caller
      │
      ▼
[handler]             ← sql = MyDB.getOrFailed(); sql`SELECT ...`
```

---

# CORE CONCEPTS

## `sqlPlugin(config)`

The plugin factory accepts `Bun.SQL.Options`: either a connection string or an options object (e.g. `adapter`, `hostname`, `port`, `database`, `username`, `password`). The same options are passed to `new Bun.SQL(config)`.

```typescript
// Connection string (PostgreSQL, MySQL, or SQLite)
sqlPlugin("postgres://user:pass@localhost:5432/mydb");
sqlPlugin("mysql://user:pass@localhost:3306/mydb");
sqlPlugin("sqlite://./data.db");

// Options object (e.g. MySQL)
sqlPlugin({
  adapter: "mysql",
  hostname: "localhost",
  port: 3306,
  database: "myapp",
  username: "dbuser",
  password: "secret",
});
```

## Obtaining the client in handlers

The plugin declares one AppState (`Bun.SQL`). You **must** destructure that state from the return value of `app.register()` and use it in routes. The client is shared across the app (single instance).

A common convention is to name the state after the database (e.g. database `mydb` → state `MyDB`), then get the client with `getOrFailed()`:

```typescript
const [MyDB] = await app.register(sqlPlugin("postgres://localhost/mydb"));

app.get("/users", async () => {
  const sql = MyDB.getOrFailed();
  const users = await sql`SELECT * FROM users LIMIT 10`;
  return Response.json(users);
});
```

## Multiple clients

You can register the plugin **multiple times** with different configs. Each call to `sqlPlugin(config)` creates a new AppState and a new `Bun.SQL` instance, so you get one state per database. Destructure a different name from each `register()` and use the corresponding state in handlers.

```typescript
const [MyDB] = await app.register(sqlPlugin("postgres://localhost/mydb"));
const [AnalyticsDB] = await app.register(sqlPlugin("mysql://localhost/analytics"));
const [CacheDB] = await app.register(sqlPlugin("sqlite://./cache.db"));

app.get("/users", async () => {
  const sql = MyDB.getOrFailed();
  return Response.json(await sql`SELECT * FROM users`);
});

app.get("/stats", async () => {
  const sql = AnalyticsDB.getOrFailed();
  return Response.json(await sql`SELECT * FROM events LIMIT 100`);
});
```

Each registration is independent: different adapters (PostgreSQL, MySQL, SQLite), different connection strings, and separate connection pools.

## Using the client (Bun.SQL)

The value from `state.getOrFailed()` is a `Bun.SQL` instance. Use tagged template literals for queries (parameters are safely bound; no manual escaping). See [Bun SQL docs](https://bun.com/docs/runtime/sql) for transactions, bulk inserts, and adapter-specific options.

```typescript
const sql = MyDB.getOrFailed();

// Parameterized query
const row = await sql`SELECT * FROM users WHERE id = ${userId}`;

// Transaction
await sql.begin(async (tx) => {
  await tx`INSERT INTO logs (msg) VALUES (${msg})`;
  await tx`UPDATE counters SET n = n + 1 WHERE id = ${id}`;
});
```

---

# DESIGN DECISIONS

## Why a plugin instead of creating `Bun.SQL` in handlers?

- **Single instance**: One connection pool per app; creating `new Bun.SQL()` in every handler would open many connections.
- **DI consistency**: RavenJS uses AppState for app-scoped dependencies; the SQL client fits this model and is available anywhere in the request chain without passing arguments.
- **Testability**: In tests, you can register a different plugin (or mock state) without changing handler code.

## Why return the state from `register()`?

The state is created inside the plugin factory, so the only way for the app to get a reference is via the tuple returned by `register()`. This follows the same pattern as other RavenJS plugins (see [PLUGIN.md](https://github.com/bytedance/ravenjs/blob/main/modules/core/PLUGIN.md) in core).

---

# GOTCHAS

## 1. Always `await app.register(sqlPlugin(...))` and destructure the state

If you don't capture the state, you cannot access the client in handlers.

```typescript
// ❌ Wrong: state is lost
await app.register(sqlPlugin(process.env.DATABASE_URL!));

app.get("/users", () => {
  // No way to get the client
});

// ✓ Correct: destructure state (e.g. name after db) and use in handlers
const [MyDB] = await app.register(sqlPlugin(process.env.DATABASE_URL!));
app.get("/users", async () => {
  const sql = MyDB.getOrFailed();
  const users = await sql`SELECT * FROM users`;
  return Response.json(users);
});
```

## 2. Register the plugin before defining routes that use the client

Plugins are loaded when you call `register()`. As with other plugins, ensure registration happens before routes that depend on the SQL state.

## 3. Bun.SQL requires Bun runtime

This plugin depends on `Bun.SQL`, which is only available in the Bun runtime. Do not use it in Node or other runtimes.

---

# USAGE EXAMPLES

## Minimal (PostgreSQL with env URL)

```typescript
import { Raven } from "@raven.js/core";
import { sqlPlugin } from "@raven.js/sql";

const app = new Raven();
const [MyDB] = await app.register(sqlPlugin(process.env.DATABASE_URL!));

app.get("/", async () => {
  const sql = MyDB.getOrFailed();
  const rows = await sql`SELECT 1 as num`;
  return Response.json(rows);
});

Bun.serve({ fetch: (req) => app.handle(req), port: 3000 });
```

## Query with parameters

```typescript
import { ParamsState } from "@raven.js/core";

const [AppDB] = await app.register(sqlPlugin("sqlite://./app.db"));

app.get("/user/:id", async () => {
  const { id } = ParamsState.getOrFailed();
  const sql = AppDB.getOrFailed();
  const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user);
});
```

## Transaction

```typescript
import { BodyState } from "@raven.js/core";

app.post("/transfer", async () => {
  const sql = MyDB.getOrFailed();
  const body = BodyState.getOrFailed() as { from: string; to: string; amount: number };
  await sql.begin(async (tx) => {
    await tx`UPDATE accounts SET balance = balance - ${body.amount} WHERE id = ${body.from}`;
    await tx`UPDATE accounts SET balance = balance + ${body.amount} WHERE id = ${body.to}`;
  });
  return new Response(null, { status: 204 });
});
```

## Multiple databases

Register the plugin once per database and name each state after that database (e.g. `MyDB`, `AnalyticsDB`).

```typescript
import { Raven } from "@raven.js/core";
import { sqlPlugin } from "@raven.js/sql";

const app = new Raven();

const [MyDB] = await app.register(sqlPlugin(process.env.DATABASE_URL!));
const [AnalyticsDB] = await app.register(sqlPlugin(process.env.ANALYTICS_DATABASE_URL!));

app.get("/users", async () => {
  const sql = MyDB.getOrFailed();
  const users = await sql`SELECT id, name FROM users`;
  return Response.json(users);
});

app.get("/metrics", async () => {
  const sql = AnalyticsDB.getOrFailed();
  const rows = await sql`SELECT * FROM metrics WHERE ts > NOW() - INTERVAL 1 DAY`;
  return Response.json(rows);
});
```

---

# ANTI-PATTERNS

## Do not create a new `Bun.SQL` inside handlers

```typescript
// ❌ New client per request — no pooling, wasteful
app.get("/users", async () => {
  const db = new Bun.SQL(process.env.DATABASE_URL!);
  const users = await db`SELECT * FROM users`;
  return Response.json(users);
});

// ✓ Use the injected client: name state after db, then get client
const [MyDB] = await app.register(sqlPlugin(process.env.DATABASE_URL!));
app.get("/users", async () => {
  const sql = MyDB.getOrFailed();
  const users = await sql`SELECT * FROM users`;
  return Response.json(users);
});
```

## Do not forget to await `register()`

```typescript
// ❌ Plugin may not have run yet; client not set
app.register(sqlPlugin(config));
app.get("/", async () => {
  const sql = MyDB.getOrFailed(); // may throw or use undefined state
});

// ✓ Always await and destructure the state
const [MyDB] = await app.register(sqlPlugin(config));
```
