---
name: raven-update
description: Upgrade the project-local Raven CLI, sync installed Raven modules, analyze the resulting Git diff, and adapt project code for breaking changes. Only trigger when explicitly invoked by name (e.g. "use raven-update" or called from another skill).
compatibility: Requires Bun and Git
---

# RavenJS Update Skill

Use this skill when the user wants to update RavenJS in an existing project.

This skill is the canonical RavenJS update workflow:

1. Verify Bun and Git are available.
2. Verify the current directory is a **clean Git worktree**.
3. Upgrade the project-local `@raven.js/cli`.
4. Run `bunx raven sync`.
5. Analyze the resulting Git diff.
6. If the update introduces breaking changes, modify the project code to adapt.

Do **not** rely on old concepts such as `raven update`, `raven diff`, or `raven status` hash fields. Use Git diff plus the updated RavenJS docs instead.

## Step 0 — Verify prerequisites

Run:

```bash
bun --version
```

- If Bun is unavailable, stop and tell the user to install Bun: https://bun.sh

Run:

```bash
git --version
git rev-parse --is-inside-work-tree
git status --porcelain
```

Rules:

- If Git is unavailable, stop and tell the user to install Git.
- If the current directory is not inside a Git worktree, stop and tell the user to initialize Git or create a recoverable backup first.
- If `git status --porcelain` is non-empty, stop and tell the user to commit, stash, or otherwise back up the current changes before updating.

Do not continue unless the worktree is clean.

## Step 1 — Upgrade the project-local CLI

Run:

```bash
bun add -d @raven.js/cli@latest
```

This skill upgrades the CLI in the **current project**. It does not use a global CLI install.

## Step 2 — Verify Raven is initialized

Run:

```bash
bunx raven status
```

If the project is not initialized for RavenJS, stop and direct the user to use `raven-setup` first.

Use the `modules` array and `language` field from `raven status` as the live source of truth for the installed Raven modules and the user's interaction language.

## Step 3 — Sync installed Raven modules

Run:

```bash
bunx raven sync
```

`raven sync` rebuilds the installed Raven modules from the embedded registry source. Because the worktree was verified clean in Step 0, the resulting Git diff cleanly represents this update.

## Step 4 — Analyze the update diff

Use Git diff to understand what changed:

```bash
git diff -- package.json bun.lockb bun.lock raven/
```

Then inspect impacted project files as needed:

- Search Raven imports and references in project code.
- Read the updated module docs directly from the installed Raven directories (`GUIDE.md`, `README.md`, pattern docs).
- Focus on API changes, path changes, config contract changes, and runtime wiring changes.

Do not guess from memory. Use the updated code and docs in the project.

## Step 5 — Adapt breaking changes

If the diff shows a breaking change, continue until the project code is adapted:

- Update imports, config, and Raven integration code that no longer matches the new framework code.
- If a module API changed, read the updated docs before editing.
- Keep user-facing business logic intact unless the upgrade requires a structural change.

Do not stop at “this looks breaking”. The job is to complete the adaptation when it is reasonably clear how to do so.

## Step 6 — Validate

Run the most relevant validation available in the project:

- Targeted tests if they exist
- Build or typecheck if the project defines one
- The smallest command that verifies the changed Raven integration paths

If validation fails, use the failure output together with the diff and updated docs to continue fixing the project.

## Step 7 — Report

Tell the user:

- The CLI dependency changes
- The Raven module changes under `raven/`
- Whether any breaking changes were detected
- Which project files were adapted because of the upgrade
- Which validation was run and the result

## Guardrails

- Never run `bunx raven sync` in a dirty worktree.
- Never rely on deprecated or nonexistent Raven CLI commands.
- Use Git diff for change analysis; do not expect `raven status` to provide diff/hash metadata.
- When breaking changes are found, adapt the project code instead of only reporting them.
