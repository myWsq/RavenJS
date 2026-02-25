---
name: raven-setup
description: Configure a RavenJS project so the core module runs correctly in the user's environment.Only trigger when explicitly invoked by name (e.g. "use raven-setup" or called from another skill).
compatibility: Requires Raven CLI
---

# RavenJS Setup Skill

Configure the project environment so that the RavenJS `core` module executes correctly. This skill does **not** build a full application — it only ensures the runtime is properly set up.

**When to use:** The user may have installed only the RavenJS skills (e.g. via `install-raven`) and not yet installed the CLI or run `raven init`. This skill handles that: when `bunx raven` is not available, install `@raven.js/cli` in the project, then run `raven init`, add core, and complete configuration. The user does **not** need to run the CLI manually before invoking raven-setup.

---

## Step 0 — Verify prerequisites

**Runtime:** This skill uses `bunx raven` and runs tests with `bun`. Ensure Bun is installed:
```bash
bun --version
```
- **Command not found** → **stop** and tell the user:
  > Bun is required. Please install: https://bun.sh

**Raven CLI:** Use project-local CLI:
```bash
bunx raven status
```
Handle the result:
- **Command not found** → **do not stop**. Install the CLI in the current project, then continue:
  1. Run `bun add -d @raven.js/cli` in the project.
  2. Run `bunx raven init` to create the raven root and `raven.yaml`. The command will print the status JSON at the end — use that as the initial status.
  3. Continue with the rest of this skill (add core, configuration checks).
- **`ravenDir` missing or `initialized: false`** → run `bunx raven init` to initialize the project. The command will print the status JSON at the end — use that; no need to re-run `bunx raven status`.
- **Otherwise** → note the `ravenDir` path and the `modules` array and continue.

---

## Step 1 — Ensure `core` is installed

From the `bunx raven status` output, check whether `core` appears in `modules` with `installed: true`.

- **Already installed** → continue to Step 2.
- **Not installed** → follow the **raven-add** skill to add `core`. The `raven add` command prints a status JSON at the end — use that to confirm `core` appears with `installed: true`, then continue to Step 2.

---

## Step 2 — Learn the `core` module

Follow the **raven-learn** skill for the `core` module. Do not skip this step — the guide is the authoritative reference for what a valid minimal example looks like.

---

## Step 3 — Inspect the project environment

Gather the information needed to judge whether the project can execute the `core` module:

1. Read `package.json` — note `type`, `scripts`, `dependencies`, `devDependencies`.
2. Check whether a `tsconfig.json` exists at the project root (or the path referenced from `package.json`). If it exists, read it and check for `compilerOptions.paths` — specifically whether `@raven.js` (or `@raven.js/*`) is mapped to `ravenDir`.
3. Derive `ravenDir`: from `bunx raven status` output, take any installed module's `installDir` (e.g. `core`), remove the last path segment to get the raven root directory; compute its path **relative to the project root** (where `tsconfig.json` lives). Example: if `installDir` is `/path/to/proj/raven/core`, then `ravenDir` relative to project root is `./raven`.
4. Confirm runtime. Raven requires Bun `>=1.0`.

---

## Step 4 — Diagnose potential issues

Based on what you found in Step 3, identify which of the following problems apply. **Do not assume problems that are not evidenced** — only flag what you actually observe.

| Problem | Evidence to look for |
|---|---|
| Bun not installed or version too old | `bun --version` fails or < 1.0 |
| Missing or incomplete `tsconfig.json` | File absent, or missing `target` / `moduleResolution` |
| `@raven.js` path not pointing to `ravenDir` | `tsconfig.json` lacks `compilerOptions.paths["@raven.js/*"]` or it points to a different directory than the derived `ravenDir` |
| Package dependencies missing | `bunx raven add` listed packages not present in `node_modules` |
| Incompatible `moduleResolution` | `node` instead of `bundler` or `node16`/`nodenext` |

List the diagnosed problems before fixing anything.

---

## Step 5 — Fix configuration issues

Fix only the issues identified in Step 4. Apply the **minimum change** needed — do not refactor or improve unrelated config.

**What to fix (project-level configuration):**
- Install missing packages using the project's package manager (`bun install`, `npm install`, etc.).
- Add or correct `tsconfig.json` settings for TypeScript.
- Ensure `@raven.js` path alias points to `ravenDir` — see below.

**tsconfig.json — configuring `@raven.js` path mapping:**

TypeScript requires both `baseUrl` and `paths` in `compilerOptions` to resolve `import ... from "@raven.js/core"`:

1. **`baseUrl`**: Set to `"."` (resolves relative to the directory containing tsconfig.json). Keep existing `baseUrl` if present.
2. **`paths`**: Add `"@raven.js/*": ["<ravenDir>/*"]`, where `<ravenDir>` is the raven root path relative to the project root:
   - Default root (`raven`): use `"./raven/*"`
   - Custom root (e.g. `--root my-raven`): use `"./my-raven/*"`

Example (default root):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@raven.js/*": ["./raven/*"]
    }
  }
}
```

If the project already has `paths`, **merge** `"@raven.js/*": ["./raven/*"]` into the existing object — do not overwrite other aliases.

**What NOT to touch:**
- Files inside `ravenDir` (the raven root directory) — **do not modify framework code** unless you are certain beyond reasonable doubt that the file itself contains a bug. Configuration problems in the project almost always explain runtime errors.
- `package.json` scripts unrelated to TypeScript execution.
- Any files the user has not asked you to change.

**Lint / format tools:**
If the project has a linter or formatter configured (ESLint, Biome, Prettier, etc.), add the `ravenDir` to its ignore list so it does not flag the framework code. Do not attempt to fix lint errors inside `ravenDir`.

---

## Step 6 — Write and run a minimal test

Create a temporary file at the project root named `_raven_setup_test.ts`.

Use the USAGE EXAMPLES or Minimal Example from the `bunx raven guide core` output as the basis. The file must:
- Import only from the `core` module paths shown in the guide (or from the installed raven path, e.g. `./raven/core`, or `@raven.js/core` when `tsconfig.json` paths map `@raven.js` to `ravenDir`).
- Define a minimal server (one route is enough).
- **Not** call `.listen()` or start a long-running process — just confirm the app object constructs without throwing.
- Exit with code 0 on success, non-zero on failure.

Run the file with Bun:
```bash
bun run _raven_setup_test.ts
```

**If the run fails:**
1. Read the error message carefully.
2. If it points to a **configuration problem** (import resolution, missing module, tsconfig option) → fix the configuration and re-run. Repeat until resolved or you reach a dead end.
3. If it points to a **framework code problem** (and you are certain after reading the relevant source) → describe the issue to the user and ask for guidance before touching any file in `ravenDir`.
4. If you cannot resolve the error after two attempts → **stop**, show the user the exact error, and explain what you tried.

---

## Step 7 — Clean up

Delete `_raven_setup_test.ts`.

---

## Step 8 — Report

Tell the user:
- Which issues were found and fixed (if any).
- That the project is ready to use RavenJS `core`.

---

## Guardrails

- If a lint/format tool is configured, exclude `ravenDir` instead of fixing its warnings.
- Do not start a long-running server in the test file.
- Always delete the temporary test file, even if the run fails.
- Do not suggest adding unnecessary dependencies. RavenJS is Bun-only.
