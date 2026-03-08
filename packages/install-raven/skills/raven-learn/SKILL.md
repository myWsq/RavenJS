---
name: raven-learn
description: Load and study a RavenJS module's API, architecture, design decisions, and pattern entrypoints. Only trigger when explicitly invoked by name (e.g. "use raven-learn" or called from another skill).

compatibility: Requires Raven CLI
---

# RavenJS Learn Skill

Load the full documentation and source code for a RavenJS module by reading its GUIDE.md, referenced files, and relevant pattern documents directly.

---

## Step 0 — Get module info from status

Run `bunx raven status` and parse the JSON output. Find the target module in `status.modules` where `installed: true`.

- If the module is not installed, stop and suggest using the **raven-add** skill first.
- If installed, use the module's `installDir` field as the module directory path (absolute path).

---

## Step 1 — Read the module's GUIDE.md

Read the module's GUIDE.md from the directory obtained in Step 0:

**Path**: `{installDir}/GUIDE.md` (where `installDir` comes from the status output's `modules[].installDir`)

GUIDE.md is a markdown document that tells you how to learn the module.

---

## Step 2 — Follow pattern entrypoints when the task writes RavenJS application code

Use the module guide first. Then decide whether the upcoming task is about RavenJS application structure or runtime assembly.

- If the target module is `core`, or the upcoming task will create or change RavenJS application code built on top of core, also load the installed core pattern docs.
- If the target module is not `core`, use the same `bunx raven status` output to locate the installed `core` module and treat its `installDir` as the pattern document root.

Pattern reading path:

- Business code (`interface`, `service`, `entity`, `repository`, `command`, `query`, `projection`, `dto`) → `{coreInstallDir}/pattern/overview.md`, then the relevant sections in `layer-responsibilities.md`, `conventions.md`, and `anti-patterns.md`
- Runtime assembly (`app.ts`, plugins, states, scopes, hooks`) → `{coreInstallDir}/pattern/runtime-assembly.md`, then `anti-patterns.md`before finishing the learning pass. Use this path only when Raven runtime must own initialization, lifetime, or scope; do not route an ordinary reusable helper here just because it is shared. If it is just a reusable capability surface, prefer the`Object Style Service` path instead.

Do not bulk-read every pattern document by default. Pick the path that matches the task.

---

## Step 3 — Read the referenced files

The guide points you to the files that matter. It often references other docs or files (e.g. README.md, source files). If the guide uses relative paths, resolve them from `installDir` first — look for the file under the module directory before searching elsewhere.

---

## Guardrails

- Do not rely on prior knowledge — follow the guide structure.
- Treat GUIDE / README / source files as the API and implementation map, and treat pattern docs as the source of truth for file structure and boundary rules.
- If this learning session will lead to code generation, do not stop until both the relevant guide path and the relevant pattern path are complete.
- If something is unclear, re-read the guide and referenced files before asking or guessing.
