---
name: raven-use
description: Workflow for writing correct RavenJS code — verify core status, learn APIs and patterns, plan structure, then implement. Use when creating servers, routes, hooks, validation, or using RavenJS core.
compatibility: Requires Raven CLI
---

# RavenJS Use Skill

A workflow for writing correct RavenJS code: check project status, learn the installed core tree and patterns, plan structure, then write.

## Step 0 — Verify prerequisites

Run:

```bash
bunx raven status
```

Handle the result:

- **Command not found** → stop and tell the user: `Raven CLI is required. Install in the project: bun add -d @raven.js/cli`
- **`installed: false`** → stop and tell the user: `This project has not been initialized. Run raven-setup or bunx raven init to get started.`
- **Otherwise** → continue with `installDir`, `rootDir`, and `language`.

## Step 1 — Learn RavenJS before editing

Follow the **raven-learn** skill first.

Read the core guide, the files it references, and the relevant pattern docs. If the task needs a concrete plugin example, also read from `{rootDir}/examples/`.

## Step 2 — Make a Pattern Plan

Before editing files, classify the task into one of these shapes:

- `object style service`
- `simple write`
- `reusable write`
- `complex read`
- `runtime assembly`

Write down a short Pattern Plan in your notes before touching files. It must answer:

- which task shape applies
- which layers are required, and which layers are explicitly not needed
- which files or directories should be created or updated
- whether each reusable dependency is runtime state, an `Object Style Service`, or a specialized form such as `Repository` / `Command` / `Query`
- where business rules, persistence, query logic, hooks, and plugins belong

## Step 3 — Write the code

Apply the Pattern Plan and the relevant guide output. Follow the pattern docs, GOTCHAS, ANTI-PATTERNS, and USAGE EXAMPLES exactly.

## Step 4 — Run a pattern self-check

Before finishing, review the changed code against:

- `{installDir}/pattern/anti-patterns.md`
- `{installDir}/pattern/conventions.md`

At minimum, verify:

- entities and repositories did not import Raven runtime APIs without a strong reason
- hooks and plugins did not absorb business logic that belongs elsewhere
- ordinary reusable helpers were not turned into `AppState` when `Object Style Service` was enough
- new files follow the expected naming and placement rules

## Guardrails

- Run `bunx raven status` at the start of every invocation.
- Do not modify files inside the installed Raven root unless you are fixing the framework itself.
- Do not write code until the relevant guide and pattern reading is complete.
