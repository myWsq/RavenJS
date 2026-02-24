---
name: raven-learn
description: Load and study a RavenJS module's API, architecture, and design decisions.Only trigger when explicitly invoked by name (e.g. "use raven-learn" or called from another skill).
  
compatibility: Requires Raven CLI
---

# RavenJS Learn Skill

Load the full documentation and source code for a RavenJS module using `bunx raven guide`.

---

## Step 0 — Verify the module is installed

Run `bunx raven status` and confirm the target module appears with `installed: true`.

If it is not installed, stop and suggest using the **raven-add** skill first.

---

## Step 1 — Load the module guide

```bash
bunx raven guide <module-name>
```

The command outputs the module's GUIDE.md — a markdown document that tells you how to learn the module. It typically includes:

- **What to Read** — files to read and the order (e.g. README.md, index.ts)
- **Key Concepts** — main types, classes, and APIs
- **GOTCHAS** — common mistakes to avoid
- **USAGE EXAMPLES** — copy-paste starting points

---

## Step 2 — Follow the guide structure

Read the guide output and follow its sections in order. If it says "Read README.md first", read that file. If it lists Key Concepts or GOTCHAS, study them before writing code.

---

## Step 3 — Read the referenced files

The guide points you to the files that matter. Read those files (README, source) as directed. Skim for `SECTION` comments in source to find relevant parts.

---

## Guardrails

- Run `bunx raven guide` — the guide output is the authoritative learning path for the module.
- Do not rely on prior knowledge — follow the guide structure.
- If something is unclear, re-read the guide and referenced files before asking or guessing.
