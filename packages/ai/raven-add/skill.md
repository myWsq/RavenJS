---
name: raven-add
description: Install a new module into an initialized RavenJS project.Only trigger when explicitly invoked by name (e.g. "use raven-add" or called from another skill).
compatibility: Requires Raven CLI
---

# RavenJS Add Skill

Install a new module into an initialized RavenJS project using `bunx raven add`.

---

## Step 0 — Verify prerequisites

Run `bunx raven status` and confirm the project is initialized (raven root directory exists).

If not initialized, stop and tell the user to run `bunx raven init` first, then use the **raven-setup** skill.

---

## Step 1 — Identify the module to add

From the user's request, determine the module name:

- **Explicit name** (e.g. "add jtd-validator") → use it directly.
- **Described functionality** → infer the module from `bunx raven status` module descriptions.
- **Unclear** → use **AskUserQuestion** to ask; show the available modules from the `modules` array in `bunx raven status`.

Do not hardcode module names — always derive the available list from the live `bunx raven status` output.

---

## Step 2 — Add the module

```bash
bunx raven add <module-name>
```

`bunx raven add` resolves dependencies automatically — for example, adding `jtd-validator` will install `core` first if not already present.

On success, the command returns JSON with:

- `modifiedFiles` — every file created or updated
- `dependencies` — npm packages the module requires

---

## Step 3 — Confirm installation

Run `bunx raven status` and verify the module appears with `installed: true`.

---

## Step 4 — Install package dependencies

Check the `dependencies` field from the `bunx raven add` output against the project's `package.json`:

- For each entry, check whether it appears in `dependencies` or `devDependencies` with a satisfying version.
- If any are missing or out of range, detect the project's package manager and run the appropriate install or update command.

---

## Step 5 — Learn the module API

Follow the **raven-learn** skill to study the module before writing any code.

---

## Guardrails

- Only add modules listed in the `modules` array from `bunx raven status` — do not invent module names.
- Do not skip Step 4 — missing npm dependencies will cause runtime errors.
- Do not write code until Step 5 (learn) is complete.
