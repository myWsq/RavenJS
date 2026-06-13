<div align="center">

<img src="./docs/logo.webp" alt="RavenJS Logo" width="320" />

RavenJS is an **AI-native** web framework on a **Hono** engine. Lightweight, contract-first, multi-runtime.

**Primary audience**: AI Agents (e.g. Claude, Cursor, Codex).

</div>

## Philosophy

- **AI-native, skill-first**: RavenJS is optimized for AI agents to learn and write correct code. All teaching material travels with the self-contained `raven-use` skill; the npm package ships only compiled code, types, and a thin README.
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

Work with RavenJS primarily through the **`raven-use`** skill. It lives in this repo under [`skills/`](skills/) — RavenJS ships no installer of its own; install it with the generic [`skills`](https://github.com/vercel-labs/skills) CLI, which pulls straight from this repo:

```bash
npx skills add myWsq/RavenJS        # installs into .claude/skills (also .cursor, .codex, …)
# or copy manually: cp -r skills/raven-use your-project/.claude/skills/
```

| Skill         | When to use                                                                                                                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **raven‑use** | Learn RavenJS (API surface, request lifecycle, ambient state/DI, schema & contract, plugins, OpenAPI, gotchas, and the layered code-organization patterns) and write correct application code — routes, handlers, hooks, validation, state, contracts, plugins. |

The skill is **self-contained**: all teaching material — the API/runtime reference and the layered pattern reference — ships inside the skill at [`skills/raven-use/reference/`](skills/raven-use/reference/). It does **not** read docs from `node_modules`; the npm package no longer bundles teaching docs. For exact, version-matched type signatures, the skill consults `node_modules/@raven.js/core/dist/index.d.mts` in the installed package. Installing the package and upgrading it are ordinary npm operations — see the Quick Start above and, for upgrades, run `npm install @raven.js/core@latest` and check [MIGRATION.md](MIGRATION.md) for breaking changes.

## Core Reference

- `@raven.js/core` provides HTTP services, contract-first routing, lifecycle hooks, ambient state management, Standard Schema request validation, and self-built OpenAPI export.
- Package overview: [packages/core/README.md](packages/core/README.md). The full teaching reference (API, lifecycle, state/DI, schema & contract, plugins, OpenAPI, gotchas, and layered patterns) lives in the skill: [skills/raven-use/reference/](skills/raven-use/reference/).

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
