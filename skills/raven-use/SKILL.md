---
name: raven-use
description: Learn the installed @raven.js/core and write correct RavenJS code — confirm the package resolves, read the installed core's GUIDE/API docs plus this skill's bundled pattern reference, plan structure against the layered conventions, implement, then self-check. Use when creating or editing RavenJS servers, routes, handlers, hooks, validation, ambient state, contracts, plugins, or query/DTO code.
compatibility: Requires @raven.js/core installed (npm)
---

# RavenJS Use Skill

A workflow for writing correct RavenJS code: confirm the package, learn the installed core and patterns, plan structure, then write. The framework is a normal npm dependency — this skill assumes `@raven.js/core` is already installed: it reads the core's API docs from the installed package and the layered pattern rules from its own bundled `reference/` docs.

## Step 0 — Confirm the package resolves

Confirm `@raven.js/core` (and the `hono` peer) resolve:

```bash
node -e "console.log(require.resolve('@raven.js/core/package.json'))"
```

Handle the result:

- **Not resolvable** → stop and tell the user the package is not installed yet; point them at the README Quick Start to set the project up first.
- **Resolvable** → continue; use the resolved package dir as the docs source for learning and self-check. (In monorepos / pnpm it may be hoisted or symlinked — resolve the real path.)

## Step 1 — Learn the installed core

Learn from two sources — do not rely on prior knowledge:

- **Installed core API docs** (version-matched, at `node_modules/@raven.js/core/`): `GUIDE.md`, `README.md`, `PLUGIN.md`.
- **Bundled pattern reference** (ships with this skill, in `reference/`): the layered methodology and self-check rules.

1. **Read the core GUIDE** — `GUIDE.md` is the primary reading map for the installed version: it points at the public API surface and the source map.
2. **Follow the pattern reference by task shape** (in this skill's `reference/`):
   - Business code (`interface`, `entity`, `repository`, `command`, `query`, `dto`, query-result mapping) → `reference/overview.md`, then the relevant sections of `reference/layer-responsibilities.md`, `reference/conventions.md`, and `reference/anti-patterns.md`.
   - Runtime assembly (`app.ts`, plugins, states, scopes, hooks, serve) → `reference/runtime-assembly.md`, then `reference/anti-patterns.md` before finishing.
3. **Read API/plugin references when relevant** — `README.md` for the public API and request lifecycle; `PLUGIN.md` for writing a plugin (`definePlugin`, the three state patterns, gotchas).

**Engine boundary**: RavenJS 3.x runs on a **Hono** engine, but Hono's context `c` is an internal detail — handlers receive only the validated `{ body, query, params, headers }` and read everything else via ambient state (`RavenContext`, `AppState`/`RequestState`). Do not write code that expects a Hono `c` parameter.

Do not stop until both the relevant GUIDE path and the relevant pattern path are complete.

## Step 2 — Make a Pattern Plan

Before editing files, classify the task into one of these shapes:

- `object style service`
- `simple write`
- `reusable write`
- `complex read`
- `runtime assembly`

Write down a short Pattern Plan before touching files. It must answer:

- which task shape applies
- which layers are required, and which are explicitly not needed
- which files/directories to create or update
- whether each reusable dependency is runtime state, an `Object Style Service`, or a specialized form (`Repository` / `Command` / `Query`)
- where business rules, persistence, query logic, hooks, and plugins belong

## Step 3 — Write the code

Apply the Pattern Plan and the guide output. Import from the package:

```ts
import { Raven, defineContract, defineAppState /* ... */ } from "@raven.js/core";
```

Follow the pattern docs, GOTCHAS, ANTI-PATTERNS, and USAGE EXAMPLES exactly. Handlers receive only `{ body, query, params, headers }` and read other request data via ambient state — never expect a Hono `c`.

## Step 4 — Run a pattern self-check

Before finishing, review the changed code against this skill's `reference/anti-patterns.md` and `reference/conventions.md`. At minimum verify:

- entities and repositories did not import Raven runtime APIs without a strong reason
- hooks and plugins did not absorb business logic that belongs elsewhere
- ordinary reusable helpers were not turned into `AppState` when `Object Style Service` was enough
- new files follow the expected naming and placement rules

## Guardrails

- Confirm `@raven.js/core` resolves at the start of every invocation.
- Do not rely on prior knowledge — follow the GUIDE structure and the installed docs. Treat the installed GUIDE / README / PLUGIN as the API map, and this skill's bundled `reference/` docs as the source of truth for file structure and boundary rules.
- Do not edit files inside `node_modules/@raven.js/core` (the framework is an installed dependency, not project source).
- Do not write code until the relevant guide and pattern reading is complete.
