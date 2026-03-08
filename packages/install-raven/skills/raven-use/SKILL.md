---
name: raven-use
description: Workflow for writing correct RavenJS code — verify state, identify modules, learn APIs and patterns, plan structure, then implement. Use when creating servers, routes, hooks, validation, or using Raven modules.
compatibility: Requires Raven CLI
---

# RavenJS Use Skill

A workflow for writing correct RavenJS code: check project state, identify needed modules, learn their APIs and patterns, plan structure, then write.

---

## Step 0 — Verify prerequisites

Run:

```bash
bunx raven status
```

Handle the result:

- **Command not found** → **stop** and tell the user:
  > Raven CLI is required. Install in the project: `bun add -d @raven.js/cli`, then run `bunx raven status`.
- **`ravenDir` missing or `initialized: false`** → **stop** and tell the user:
  > This project has not been initialized. Run `bunx raven init` to get started.
- **Otherwise** → continue with the `modules` data from this response.

---

## Step 1 — Identify required modules

From the `bunx raven status` output, read the `modules` array. Each entry contains:

- `name` — module identifier
- `description` — what the module does
- `installed` — whether it is present in the project
- `language` — the language the Agent should use to communicate with the user

Match the user's task against module descriptions. Do **not** hardcode mappings — always use the descriptions from the live status output. Common patterns:

| User wants to…                            | Likely module |
| ----------------------------------------- | ------------- |
| Create a server, define routes, add hooks | `core`        |

Select all modules that are relevant. Note which ones are already installed and which need to be added.

---

## Step 2 — Add missing modules (if needed)

If any required module is not installed, use the **AskUserQuestion tool** to ask the user whether to add it. If the user confirms, follow the **raven-add** skill.

After adding, verify from the status JSON printed by `raven add` that the module appears as installed — no need to re-run `bunx raven status`.

---

## Step 3 — Learn the module API and pattern entrypoints

For each module you will use, follow the **raven-learn** skill to load and study the guide output before writing any code.

Read the full guide output and the files it references (README, source, and relevant pattern docs). Treat the guide as the API/source map, and treat the pattern docs as the structure and boundary rules. This combined reading path is the authoritative reference — do not rely on prior knowledge.

---

## Step 4 — Make a Pattern Plan

Before editing files, classify the task into one of these shapes:

- `object style service` — cohesive reusable helper/service surface that is not runtime state
- `simple write` — one entity path, little or no reusable orchestration
- `reusable write` — multi-entity or cross-entrypoint write workflow worth extracting
- `complex read` — reusable read model that needs `Query + Projection`
- `runtime assembly` — `app.ts`, plugin, state, scope, or hook wiring

Write down a short Pattern Plan in your notes before touching files. It must answer:

- which task shape applies
- which layers are required, and which layers are explicitly not needed
- which files or directories should be created or updated
- whether each reusable dependency is true runtime state, a generic `Object Style Service`, or a specialized form such as `Repository` / `Command` / `Query`
- where business rules, persistence, query logic, hooks, and plugins belong

Apply the default-light rules from the pattern docs:

- do not add more layers by default
- use `Object Style Service` as the default shape for reusable helpers and services
- only introduce `Command` for reusable multi-entity write workflows
- only introduce `Query + Projection` for complex reusable reads
- prefer the runtime assembly path for plugin/state/hook/app problems instead of forcing business layers
- only introduce `AppState` / `RequestState` when Raven runtime must own initialization, lifetime, or scope
- do not promote an ordinary helper or service to `AppState` just because it is shared
- if a service only needs a cohesive function surface, keep it as an `Object Style Service`
- if that `Object Style Service` specifically owns `Entity <-> DB`, name it `Repository`

---

## Step 5 — Write the code

Apply the Pattern Plan and the relevant guide output. Follow the pattern docs, GOTCHAS, ANTI-PATTERNS, and USAGE EXAMPLES exactly. When in doubt, re-read the guide and pattern docs rather than relying on prior knowledge.

---

## Step 6 — Run a pattern self-check

Before finishing, review the changed code against:

- `modules/core/pattern/anti-patterns.md`
- `modules/core/pattern/conventions.md`

At minimum, verify:

- entities and repositories did not import Raven runtime APIs without a strong reason
- hooks and plugins did not absorb business logic that belongs in entities, commands, or queries
- ordinary reusable helpers were not turned into `AppState` or singleton classes when `Object Style Service` was enough
- new files follow the expected naming and placement rules
- any deliberate deviation from the pattern is explicit and justified

If the self-check finds a problem, fix it before presenting the result.

---

## Guardrails

- Run `bunx raven status` at the start of **every invocation** — never assume project state from a previous run.
- Do not modify files inside `ravenDir` unless a framework bug is certain.
- Do not write code until Step 3 (learn the module) is complete for all required modules.
- Do not skip Step 4 — every RavenJS code task needs a Pattern Plan before editing.
- Do not skip Step 6 — every RavenJS code task needs a pattern self-check before finishing.
- Do not choose `AppState` or a singleton class just because the code wants one shared instance.
- Do not suggest npm packages for functionality that a Raven module already covers.
