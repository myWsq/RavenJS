# SQL Plugin Example

This directory is an **example plugin asset**, not an installable RavenJS module.

It shows the minimal pattern for wrapping `Bun.SQL` with Raven's plugin + state APIs:

- declare an `AppState`
- create a `definePlugin(...)`
- initialize the shared client in `load(app, set)`
- read the client from handlers via `ClientState.getOrFailed()`

## Files

- `index.ts` — minimal SQL plugin example
- `GUIDE.md` — reading path for Agents

## Example

```ts
import { Raven } from "@raven.js/core";
import { ClientState, sqlPlugin } from "./raven/examples/sql-plugin";

const app = new Raven().register(sqlPlugin("sqlite://./app.db"));

app.get("/users", async () => {
  const sql = ClientState.getOrFailed();
  const rows = await sql`SELECT * FROM users LIMIT 10`;
  return Response.json(rows);
});
```

If you only need to learn the pattern, the same shape is also documented in `packages/core/pattern/runtime-assembly.md`.
