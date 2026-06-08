<div align="center">

<img src="./docs/logo.webp" alt="RavenJS Logo" width="320" />

RavenJS is an **AI-native** web framework on a **Hono** engine. Lightweight, contract-first, multi-runtime.

**Primary audience**: AI Agents (e.g. Claude, Cursor, Codex).

</div>

## Philosophy

- **AI-native, skill-first**: RavenJS is optimized for AI agents to learn and write correct code. The framework ships teaching docs inside the package, and a set of skills drives setup, learning, writing, and updating.
- **Published as an npm package**: `@raven.js/core` is a normal dependency you install and `import` — not source copied into your project. `hono` is a peer dependency.
- **Opinionated design, preserved**: contract-first (serializable contracts), Standard Schema validation (library-agnostic), ambient state DI (`AppState`/`RequestState`, no `c` threading), plugin lifecycle, and a self-built OpenAPI generator.
- **Hono under the hood**: routing, HTTP plumbing, and serving run on Hono — but Hono's context `c` is an internal detail. Handlers receive only the validated `{ body, query, params, headers }`.

## Quick Start

RavenJS runs on **Node (>=20), Bun, or Deno** (server-side). It does **not** target edge / Cloudflare Workers.

**1. Install**

```bash
npm install @raven.js/core hono
# Node only — also install the serve adapter:
npm install @hono/node-server
```

**2. Write an app**

```ts
// app.ts
import { Raven, RavenContext } from "@raven.js/core";

export const app = new Raven();

app.get("/hello/:name", () => {
  const { params } = RavenContext.getOrFailed();
  return Response.json({ message: `hello ${params.name}` });
});
```

**3. Serve it (pick your runtime)**

`app.ready()` returns a Web-standard fetch handler `(request: Request) => Promise<Response>`; the runtime does the listening.

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

## AI Skills

Work with RavenJS primarily through skills. They live in this repo under [`skills/`](skills/) — **copy the ones you want into your project** (no installer):

```bash
# from a clone/download of this repo
cp -r skills/raven-setup skills/raven-use skills/raven-learn skills/raven-update \
  your-project/.claude/skills/   # or .cursor/skills, .trae/skills
```

| Skill            | When to use                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **raven‑setup**  | Project not yet set up — installs `@raven.js/core` + `hono`, wires a serve entry, verifies a minimal app.          |
| **raven‑use**    | Write application code (routes, handlers, hooks, validation, state, contracts). Learns the API and patterns first. |
| **raven‑learn**  | Load the installed core's GUIDE, API, architecture, and pattern docs before writing code.                          |
| **raven‑update** | Upgrade the `@raven.js/core` dependency, read the changelog/migration notes, and adapt project code.               |

The skills read the framework's teaching docs (`GUIDE.md`, `pattern/`, `PLUGIN.md`) from the installed package at `node_modules/@raven.js/core/`, so they always match the installed version.

## Core Reference

- `@raven.js/core` provides HTTP services, contract-first routing, lifecycle hooks, ambient state management, Standard Schema request validation, and self-built OpenAPI export.
- Source docs: [packages/core/README.md](packages/core/README.md) · [GUIDE](packages/core/GUIDE.md) · [PLUGIN](packages/core/PLUGIN.md) · patterns under [packages/core/pattern/](packages/core/pattern/)

## Migrating from 2.x

3.x is a breaking rewrite: the engine moved to Hono, distribution moved from vendored source to an npm package, the CLI / `install-raven` were retired, and Bun-only became multi-runtime. The design philosophy and public API semantics are preserved. See [MIGRATION.md](MIGRATION.md).

## Development

```bash
pnpm install           # install workspace deps
pnpm test              # run the unit suite (vitest)
pnpm build             # build the publishable package (tsdown)
```

## Release

`@raven.js/core` is published to npm via CI. Run `pnpm release` to bump the version, commit, and push a `v*` tag; the [`release-core`](.github/workflows/release-core.yml) workflow then builds and publishes to npm with provenance on tag push. Requires an `NPM_TOKEN` repository secret.

## License

[MIT](LICENSE) © Shuaiqi Wang
