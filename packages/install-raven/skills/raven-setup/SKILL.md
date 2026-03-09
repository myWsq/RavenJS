---
name: raven-setup
description: Configure a RavenJS project so the managed core tree runs correctly in the user's environment. Only trigger when explicitly invoked by name (e.g. "use raven-setup" or called from another skill).
compatibility: Requires Raven CLI
---

# RavenJS Setup Skill

Configure the project environment so that the RavenJS managed core tree executes correctly. This skill does **not** build a full application — it only ensures the runtime is properly set up.

## Step 0 — Confirm interaction language

Before any other steps, ask the user what language the Agent should use, then keep using that language through the skill.

## Step 1 — Verify prerequisites

Ensure Bun is installed:

```bash
bun --version
```

- **Command not found** → stop and tell the user to install Bun: https://bun.sh

Check the project-local Raven CLI:

```bash
bunx raven status
```

Handle the result:

- **Command not found** → install the CLI in the current project with `bun add -d @raven.js/cli`
- Then run `bunx raven init --language <Language>` to initialize the Raven root and install the managed core tree
- If `installed` is already `true`, continue with the returned `installDir`, `rootDir`, and `language`

## Step 2 — Learn the installed core tree

Follow the **raven-learn** skill for the installed core tree before changing project configuration.

## Step 3 — Inspect the project environment

Gather the information needed to judge whether the project can execute RavenJS correctly:

1. Read `package.json`
2. Read `tsconfig.json` if it exists
3. Derive `ravenDir` from `rootDir` in `bunx raven status`
4. Confirm Bun is the runtime

## Step 4 — Diagnose potential issues

Check for:

- missing or incomplete `tsconfig.json`
- missing `@raven.js/*` path mapping to `./raven/*` (or the custom root)
- incompatible `moduleResolution`
- project package dependencies missing from the local environment

## Step 5 — Fix configuration issues

Apply the minimum change needed:

- install missing packages
- add or correct `tsconfig.json`
- ensure `compilerOptions.baseUrl` and `paths["@raven.js/*"]` point at the Raven root

## Step 6 — Write and run a minimal test

Create a temporary `_raven_setup_test.ts` at the project root that imports from `@raven.js/core`, constructs a minimal app, and exits without starting a long-running server.

Run:

```bash
bun run _raven_setup_test.ts
```

If the run fails, fix project configuration issues and retry.

## Step 7 — Clean up and report

Delete `_raven_setup_test.ts`, then tell the user:

- which issues were found and fixed
- that the project is ready to use RavenJS core
