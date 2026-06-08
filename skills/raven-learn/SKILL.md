---
name: raven-learn
description: Load and study the RavenJS core API, architecture, and pattern entrypoints from the installed @raven.js/core package docs. Only trigger when explicitly invoked by name (e.g. "use raven-learn" or called from another skill).
compatibility: Requires @raven.js/core installed (npm)
---

# RavenJS Learn Skill

Load the documentation for the **installed** RavenJS core by reading the docs that ship inside the `@raven.js/core` package. These reflect the exact installed version — do not rely on prior knowledge.

## Step 0 — Locate the installed package

Find the installed `@raven.js/core`, typically at:

```
node_modules/@raven.js/core/
```

(In monorepos / pnpm it may be hoisted or symlinked — resolve the real path, e.g. via `node -e "console.log(require.resolve('@raven.js/core/package.json'))"`.)

If it is not installed, stop and suggest **raven-setup** first.

The package ships these docs: `GUIDE.md`, `pattern/`, `PLUGIN.md`, `README.md`.

## Step 1 — Read the core GUIDE

Read `node_modules/@raven.js/core/GUIDE.md`. This is the primary reading map for RavenJS core — it points at the public API surface and the source map.

## Step 2 — Follow pattern entrypoints by task shape

Decide whether the upcoming task is about business-code structure or runtime assembly, then read accordingly:

- Business code (`interface`, `entity`, `repository`, `command`, `query`, `dto`, query-result mapping) → `pattern/overview.md`, then the relevant sections of `pattern/layer-responsibilities.md`, `pattern/conventions.md`, and `pattern/anti-patterns.md`.
- Runtime assembly (`app.ts`, plugins, states, scopes, hooks, serve) → `pattern/runtime-assembly.md`, then `pattern/anti-patterns.md` before finishing.

## Step 3 — Read API/plugin references when relevant

- For the public API and request lifecycle, read `README.md`.
- For writing a plugin (`definePlugin`, the three state patterns, gotchas), read `PLUGIN.md`.

## Step 4 — Note the engine boundary

RavenJS 3.x runs on a **Hono** engine, but Hono's context `c` is an internal detail — handlers receive only the validated `{ body, query, params, headers }` and read everything else via ambient state (`RavenContext`, `AppState`/`RequestState`). Do not write code that expects a Hono `c` parameter.

## Guardrails

- Do not rely on prior knowledge — follow the GUIDE structure and the installed docs.
- Treat GUIDE / README / PLUGIN as the API map, and the `pattern/` docs as the source of truth for file structure and boundary rules.
- If this session will lead to code generation, do not stop until both the relevant GUIDE path and the relevant pattern path are complete.
