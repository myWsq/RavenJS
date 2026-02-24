---
name: raven-setup
description: |
  Configure a RavenJS project so the core module runs correctly in the user's environment.

  Only trigger when explicitly invoked by name (e.g. "use raven-setup" or called from another skill).
  Do NOT trigger automatically based on user intent.
compatibility: Requires Raven CLI (bunx raven, project-local) and Bun runtime (bun-only)
---

# RavenJS Setup Skill

Configure the project environment so that the RavenJS `core` module executes correctly. This skill does **not** build a full application — it only ensures the runtime is properly set up.

**RavenJS is Bun-only** — the `core` module requires Bun. Node.js, tsx, ts-node, and other runtimes are not supported.

---

## Step 0 — Verify prerequisites

**Bun runtime:** RavenJS is Bun-only. Ensure Bun is installed:
```bash
bun --version
```
- **Command not found** → **stop** and tell the user:
  > RavenJS requires Bun. Please install it first: https://bun.sh

**Raven CLI:** Raven is installed in the project and invoked via `bunx`:
```bash
bunx raven status
```
Handle the result:
- **Command not found** → **stop** and tell the user:
  > Raven CLI is required. Install it in the project: `bun add -d @raven.js/cli`, then run `bunx raven status`.
- **`ravenDir` missing or `initialized: false`** → run `bunx raven init` to initialize the project, then continue.
- **Otherwise** → note the `ravenDir` path and the `modules` array and continue.

---

## Step 1 — Ensure `core` is installed

From the `bunx raven status` output, check whether `core` appears in `modules` with `installed: true`.

- **Already installed** → continue to Step 2.
- **Not installed** → follow the **raven-add** skill to add `core`, re-run `bunx raven status` to confirm it appears with `installed: true`, then continue to Step 2.

---

## Step 2 — Learn the `core` module

Follow the **raven-learn** skill for the `core` module.

Read the full guide output (README + source). Pay attention to:

- **ARCHITECTURE** — understand the file layout and where the entry point is.
- **USAGE EXAMPLES** — you will base the minimal test on these.
- **GOTCHAS / ANTI-PATTERNS** — avoid common mistakes in the test file.

Do not skip this step — the guide is the authoritative reference for what a valid minimal example looks like.

---

## Step 3 — Inspect the project environment

Gather the information needed to judge whether the project can execute the `core` module:

1. Read `package.json` — note `type`, `scripts`, `dependencies`, `devDependencies`.
2. Check whether a `tsconfig.json` exists at the project root (or the path referenced from `package.json`).
3. Confirm Bun usage. Look for evidence of:
   - **Bun** — `bun` in scripts, `bun.lockb` / `bun.lock` present, or `bun` as a dev dependency.
   - If the project appears to use npm/yarn/pnpm with Node — inform the user that RavenJS is Bun-only and recommend migrating scripts to use `bun run` / `bun`.

---

## Step 4 — Diagnose potential issues

Based on what you found in Step 3, identify which of the following problems apply. **Do not assume problems that are not evidenced** — only flag what you actually observe.

| Problem | Evidence to look for |
|---|---|
| Project not using Bun | npm/yarn/pnpm scripts without `bun` |
| Missing or incomplete `tsconfig.json` | File absent, or missing `target` / `moduleResolution` |
| npm package dependencies missing | `bunx raven add` listed packages not present in `node_modules` |
| Incompatible `moduleResolution` | `node` instead of `bundler` or `node16`/`nodenext` |

List the diagnosed problems before fixing anything.

---

## Step 5 — Fix configuration issues

Fix only the issues identified in Step 4. Apply the **minimum change** needed — do not refactor or improve unrelated config.

**What to fix (project-level configuration):**
- Install missing npm packages using `bun install`.
- Add or correct `tsconfig.json` settings required by Bun.

**What NOT to touch:**
- Files inside `ravenDir` (the raven root directory) — **do not modify framework code** unless you are certain beyond reasonable doubt that the file itself contains a bug. Configuration problems in the project almost always explain runtime errors.
- `package.json` scripts unrelated to TypeScript execution.
- Any files the user has not asked you to change.

**Lint / format tools:**
If the project has a linter or formatter configured (ESLint, Biome, Prettier, etc.), add the `ravenDir` to its ignore list so it does not flag the framework code. Do not attempt to fix lint errors inside `ravenDir`.

---

## Step 6 — Write and run a minimal test

Create a temporary file at the project root named `_raven_setup_test.ts`.

Use the USAGE EXAMPLES from the `bunx raven guide core` output as the basis. The file must:
- Import only from the `core` module paths shown in the guide.
- Define a minimal server (one route is enough).
- **Not** call `.listen()` or start a long-running process — just confirm the app object constructs without throwing.
- Exit with code 0 on success, non-zero on failure.

Run the file with Bun:
```bash
bun _raven_setup_test.ts
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
- That the project is ready to use RavenJS `core` with Bun.

---

## Guardrails

- Run `bunx raven status` at the start — never assume project state.
- Parse all paths from CLI JSON output; do not hardcode `ravenDir`.
- Do not modify files inside `ravenDir` unless a framework bug is certain.
- If a lint/format tool is configured, exclude `ravenDir` instead of fixing its warnings.
- Do not start a long-running server in the test file.
- Always delete the temporary test file, even if the run fails.
- Do not suggest adding unnecessary dependencies. RavenJS is Bun-only — do not recommend tsx, ts-node, Node, or other runtimes.
