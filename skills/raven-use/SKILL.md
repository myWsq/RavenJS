---
name: raven-use
description: Learn the installed @raven.js/core and write correct RavenJS code — confirm the package resolves, read the GUIDE and pattern docs that ship with the installed version, plan structure against the layered conventions, implement, then self-check. Use when creating or editing RavenJS servers, routes, handlers, hooks, validation, ambient state, contracts, plugins, or query/DTO code.
compatibility: Requires @raven.js/core installed (npm)
---

# RavenJS Use Skill

A workflow for writing correct RavenJS code: confirm the package, learn the installed core and patterns, plan structure, then write. The framework is a normal npm dependency — this skill assumes `@raven.js/core` is already installed and reads its shipped docs for the exact installed version.

## Step 0 — Confirm the package resolves

Confirm `@raven.js/core` (and the `hono` peer) resolve:

```bash
node -e "console.log(require.resolve('@raven.js/core/package.json'))"
```

Handle the result:

- **Not resolvable** → stop and tell the user the package is not installed yet; point them at the README Quick Start to set the project up first.
- **Resolvable** → continue; use the resolved package dir as the docs source for learning and self-check. (In monorepos / pnpm it may be hoisted or symlinked — resolve the real path.)

## Step 1 — Learn the installed core

Load the documentation for the **installed** RavenJS core by reading the docs that ship inside the package. These reflect the exact installed version — do not rely on prior knowledge.

The package (typically at `node_modules/@raven.js/core/`) ships these docs: `GUIDE.md`, `pattern/`, `PLUGIN.md`, `README.md`.

1. **Read the core GUIDE** — `GUIDE.md` is the primary reading map: it points at the public API surface and the source map.
2. **Follow pattern entrypoints by task shape**:
   - Business code (`interface`, `entity`, `repository`, `command`, `query`, `dto`, query-result mapping) → `pattern/overview.md`, then the relevant sections of `pattern/layer-responsibilities.md`, `pattern/conventions.md`, and `pattern/anti-patterns.md`.
   - Runtime assembly (`app.ts`, plugins, states, scopes, hooks, serve) → `pattern/runtime-assembly.md`, then `pattern/anti-patterns.md` before finishing.
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

Before finishing, review the changed code against `node_modules/@raven.js/core/pattern/anti-patterns.md` and `pattern/conventions.md`. At minimum verify:

- entities and repositories did not import Raven runtime APIs without a strong reason
- hooks and plugins did not absorb business logic that belongs elsewhere
- ordinary reusable helpers were not turned into `AppState` when `Object Style Service` was enough
- new files follow the expected naming and placement rules

## Guardrails

- Confirm `@raven.js/core` resolves at the start of every invocation.
- Do not rely on prior knowledge — follow the GUIDE structure and the installed docs. Treat GUIDE / README / PLUGIN as the API map, and the `pattern/` docs as the source of truth for file structure and boundary rules.
- Do not edit files inside `node_modules/@raven.js/core` (the framework is an installed dependency, not project source).
- Do not write code until the relevant guide and pattern reading is complete.
