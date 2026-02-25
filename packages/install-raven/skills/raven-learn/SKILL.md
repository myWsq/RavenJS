---
name: raven-learn
description: Load and study a RavenJS module's API, architecture, and design decisions.Only trigger when explicitly invoked by name (e.g. "use raven-learn" or called from another skill).

compatibility: Requires Raven CLI
---

# RavenJS Learn Skill

Load the full documentation and source code for a RavenJS module by reading its GUIDE.md and referenced files directly.

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

## Read the referenced files

The guide points you to the files that matter. It often references other docs or files (e.g. README.md, source files). If the guide uses relative paths, resolve them from `installDir` first — look for the file under the module directory before searching elsewhere. 

---

## Guardrails

- Do not rely on prior knowledge — follow the guide structure.
- If something is unclear, re-read the guide and referenced files before asking or guessing.
