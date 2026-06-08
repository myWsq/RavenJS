---
name: raven-use
description: Workflow for writing correct RavenJS code with @raven.js/core — confirm the package is installed, learn APIs and patterns, plan structure, then implement. Use when creating servers, routes, hooks, validation, state, or contracts with RavenJS.
compatibility: Requires @raven.js/core installed (npm)
---

# RavenJS Use Skill

A workflow for writing correct RavenJS code: confirm the package, learn the installed core and patterns, plan structure, then write.

## Step 0 — Confirm the package is available

Confirm `@raven.js/core` (and the `hono` peer) are installed:

```bash
node -e "console.log(require.resolve('@raven.js/core/package.json'))"
```

Handle the result:

- **Not resolvable** → stop and tell the user: install first — `npm install @raven.js/core hono` — or run **raven-setup**.
- **Resolvable** → continue; use the resolved package dir as the docs source for learning and self-check.

## Step 1 — Learn RavenJS before editing

Follow the **raven-learn** skill first. Read the core GUIDE, the files it references, and the relevant pattern docs from `node_modules/@raven.js/core/`. If the task needs a concrete plugin example, read the database plugin example in `pattern/runtime-assembly.md`.

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
- Do not edit files inside `node_modules/@raven.js/core` (the framework is an installed dependency, not project source).
- Do not write code until the relevant guide and pattern reading is complete.
