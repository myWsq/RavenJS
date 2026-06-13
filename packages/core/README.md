# @raven.js/core

RavenJS is an **AI-native**, contract-first web framework on a **Hono** engine. Lightweight,
multi-runtime, and optimized for AI agents to learn and write correct code.

`@raven.js/core` runs on **Node (20+), Bun, and Deno** (server-side; edge / Cloudflare Workers
are not a target). It layers a contract-first, ambient-state programming model on top of Hono —
**handlers never see Hono's `c`**; they receive only the validated `{ body, query, params,
headers }` and read everything else through ambient state.

- Contract-first interface helpers (`defineContract`, `registerContractRoute`)
- Standard Schema request/response validation (`withSchema`) — library-agnostic (Zod, Valibot, …)
- Ambient-state dependency injection via `AsyncLocalStorage` (`AppState` / `RequestState`)
- Lifecycle hooks and a plugin system with scoped state
- Self-built OpenAPI generation (`app.exportOpenAPI(...)`)

## Install

```bash
npm install @raven.js/core hono
# Node also needs a serve adapter:
npm install @hono/node-server
```

`hono` is a `peerDependency` — install it alongside `@raven.js/core`.

## Quick start

```ts
// app.ts
import { Raven, RavenContext } from "@raven.js/core";

export const app = new Raven();

app.get("/hello/:name", () => {
  const { params } = RavenContext.getOrFailed();
  return Response.json({ message: `hello ${params.name}` });
});
```

`app.ready()` returns a Web-standard fetch handler `(request: Request) => Promise<Response>`; the
runtime does the listening.

```ts
// Node
import { serve } from "@hono/node-server";
import { app } from "./app";
serve({ fetch: await app.ready(), port: 3000 });

// Bun
export default { port: 3000, fetch: await app.ready() };

// Deno
Deno.serve({ port: 3000 }, await app.ready());
```

## Learn RavenJS — the `raven-use` skill

RavenJS is **skill-first**: the full teaching material (API surface, request lifecycle, ambient
state/DI, schema & contract, plugins, OpenAPI, gotchas, and the layered code-organization
patterns) lives in the **`raven-use`** skill, not in this package. The npm package ships only
compiled code, type declarations, and this README. For exact, version-matched type signatures,
read `node_modules/@raven.js/core/dist/index.d.mts`.

Work with RavenJS through the skill — it ships in the [RavenJS repo](https://github.com/myWsq/RavenJS)
under `skills/`. Install it with the generic [`skills`](https://github.com/vercel-labs/skills)
CLI, which pulls straight from the repo:

```bash
npx skills add myWsq/RavenJS   # installs into .claude/skills (also .cursor, .codex, …)
# or copy manually: cp -r skills/raven-use your-project/.claude/skills/
```

## Links

- Repository, full docs, and the `raven-use` skill: <https://github.com/myWsq/RavenJS>
- Migrating from 2.x: see `MIGRATION.md` in the repo
- License: [MIT](./LICENSE)
