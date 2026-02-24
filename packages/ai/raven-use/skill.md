---
name: raven-use
description: Workflow for writing correct RavenJS code — verify state, identify modules, learn APIs, then implement. Use when creating servers, routes, hooks, validation, or using Raven modules.
compatibility: Requires Raven CLI
---

# RavenJS Use Skill

A workflow for writing correct RavenJS code: check project state, identify needed modules, learn their APIs, then write.

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

Match the user's task against module descriptions. Do **not** hardcode mappings — always use the descriptions from the live status output. Common patterns:

| User wants to… | Likely module |
|---|---|
| Create a server, define routes, add hooks | `core` |
| Validate request body / query / params / headers | `jtd-validator` |

Select all modules that are relevant. Note which ones are already installed and which need to be added.

---

## Step 2 — Add missing modules (if needed)

If any required module is not installed, use the **AskUserQuestion tool** to ask the user whether to add it. If the user confirms, follow the **raven-add** skill.

After adding, re-run `bunx raven status` to confirm the module appears as installed before continuing.

---

## Step 3 — Learn the module API

For each module you will use, follow the **raven-learn** skill to load and study the guide output before writing any code.

Read the full guide output and the files it references (README, source). This is the authoritative reference — do not rely on prior knowledge.

---

## Step 4 — Write the code

Apply the patterns from the guide output. The guide is the single source of truth — follow its GOTCHAS, ANTI-PATTERNS, and USAGE EXAMPLES sections exactly. When in doubt, re-read the guide rather than relying on prior knowledge.

---

## Guardrails

- Run `bunx raven status` at the start of **every invocation** — never assume project state from a previous run.
- Do not modify files inside `ravenDir` unless a framework bug is certain.
- Do not write code until Step 3 (learn the module) is complete for all required modules.
- Do not suggest npm packages for functionality that a Raven module already covers.
