---
name: raven-use
description: |
  Use when writing code with the RavenJS framework.

  Trigger automatically when the user wants to:
  - Create an HTTP server or REST API
  - Define routes or request handlers
  - Add middleware, lifecycle hooks (onRequest, beforeHandle, beforeResponse, onError)
  - Validate request data (body, query params, path params, headers)
  - Manage application or request-scoped state
  - Use any RavenJS module or API

  This skill does NOT handle installation, upgrades, or project setup — those are separate tasks.
compatibility: Requires Raven CLI (raven)
---

# RavenJS Use Skill

A workflow for writing correct RavenJS code: check project state, identify needed modules, learn their APIs, then write.

---

## Step 0 — Verify prerequisites

Run:
```bash
raven status
```

Handle the result:

- **Command not found** → **stop** and tell the user:
  > Raven CLI is required to use this skill. Please install it first.
- **`ravenDir` missing or `initialized: false`** → **stop** and tell the user:
  > This project has not been initialized. Run `raven init` to get started.
- **Otherwise** → continue with the `modules` data from this response.

---

## Step 1 — Identify required modules

From the `raven status` output, read the `modules` array. Each entry contains:
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

If any required module is not installed, use the **AskUserQuestion tool** to ask the user whether to add it. If the user confirms, follow:

→ **[Adding a module](./add-new-module.md)**

After adding, re-run `raven status` to confirm the module appears as installed before continuing.

---

## Step 3 — Learn the module API

For each module you will use, run its guide and study the output before writing any code:

→ **[Learning a module](./learn-module.md)**

Read the full README section (architecture, core concepts, design decisions, gotchas, anti-patterns) and the source code. This is the authoritative reference — do not rely on prior knowledge.

---

## Step 4 — Write the code

Apply the patterns from the guide output. The guide is the single source of truth — follow its GOTCHAS, ANTI-PATTERNS, and USAGE EXAMPLES sections exactly. When in doubt, re-read the guide rather than relying on prior knowledge.

---

## Guardrails

- Run `raven status` at the start of **every invocation** — never assume project state from a previous run.
- Do not hardcode module names or capabilities — always derive them from the live `raven status` output.
- Do not inline the add/guide instructions here — reference the docs above.
- Do not suggest npm packages for functionality that a Raven module already covers.
- Do not write code until Step 3 (learn the module) is complete for all required modules.
