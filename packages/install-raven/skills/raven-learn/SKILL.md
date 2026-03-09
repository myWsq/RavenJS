---
name: raven-learn
description: Load and study the RavenJS core API, architecture, design decisions, and pattern entrypoints. Only trigger when explicitly invoked by name (e.g. "use raven-learn" or called from another skill).
compatibility: Requires Raven CLI
---

# RavenJS Learn Skill

Load the documentation and source code for the installed RavenJS core tree by reading its GUIDE.md, referenced files, and relevant pattern documents directly.

## Step 0 — Get install info from status

Run `bunx raven status` and parse the JSON output.

- If `installed` is `false`, stop and suggest using **raven-setup** first.
- If `installed` is `true`, use `installDir` as the core directory path (absolute path).
- Use `rootDir` to locate bundled example assets such as `examples/sql-plugin/`.

## Step 1 — Read the core GUIDE

Read `{installDir}/GUIDE.md`.

This is the primary reading map for RavenJS core.

## Step 2 — Follow pattern entrypoints when the task writes RavenJS application code

Use the core guide first. Then decide whether the upcoming task is about business code structure or runtime assembly.

- Business code (`interface`, `entity`, `repository`, `command`, `query`, `dto`, query-result mapping) → `{installDir}/pattern/overview.md`, then the relevant sections in `layer-responsibilities.md`, `conventions.md`, and `anti-patterns.md`
- Runtime assembly (`app.ts`, plugins, states, scopes, hooks`) → `{installDir}/pattern/runtime-assembly.md`, then `anti-patterns.md` before finishing the learning pass

## Step 3 — Read example assets when relevant

If the task needs a concrete plugin example, read from `{rootDir}/examples/`.

Current official example:

- `{rootDir}/examples/sql-plugin/README.md`
- `{rootDir}/examples/sql-plugin/index.ts`

## Guardrails

- Do not rely on prior knowledge — follow the guide structure.
- Treat GUIDE / README / source files as the API and implementation map, and treat pattern docs as the source of truth for file structure and boundary rules.
- If this learning session will lead to code generation, do not stop until both the relevant guide path and the relevant pattern path are complete.
