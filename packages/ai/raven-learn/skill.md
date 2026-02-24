---
name: raven-learn
description: |
  Load and study a RavenJS module's API, architecture, and design decisions.

  Only trigger when explicitly invoked by name (e.g. "use raven-learn" or called from another skill).
  Do NOT trigger automatically based on user intent.
compatibility: Requires Raven CLI (bunx raven, project-local)
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

The command prints two tagged sections:

```
<readme>
Full content of the module's README.md
</readme>

<code>
File: path/to/file.ts
\`\`\`
// Full source code
\`\`\`
</code>
```

---

## Step 2 — Read the README

The README is the primary reference. Read these sections in order:

| Section | What to look for |
|---|---|
| **OVERVIEW** | What the module does; the philosophy behind it |
| **ARCHITECTURE** | File layout and request lifecycle diagram |
| **CORE CONCEPTS** | The key types, classes, and functions |
| **DESIGN DECISIONS** | *Why* things work the way they do — read before writing code |
| **GOTCHAS** | Common mistakes to avoid — read every item |
| **ANTI-PATTERNS** | What not to do |
| **USAGE EXAMPLES** | Copy-paste starting points |

---

## Step 3 — Read the source code

Skim for `SECTION` comments to find the relevant part, then read the types and exports. Cross-reference with the README's ARCHITECTURE section.

---

## Guardrails

- Run `bunx raven guide` — do not read individual source files manually; the guide already includes everything.
- Read GOTCHAS and ANTI-PATTERNS before writing any code.
- Do not rely on prior knowledge — the guide output is the authoritative reference.
- If something is unclear, re-read DESIGN DECISIONS before asking or guessing.
