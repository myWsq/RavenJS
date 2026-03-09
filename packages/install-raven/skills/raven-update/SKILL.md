---
name: raven-update
description: Upgrade the project-local Raven CLI, sync the managed Raven core tree, analyze the resulting Git diff, and adapt project code for breaking changes. Only trigger when explicitly invoked by name (e.g. "use raven-update" or called from another skill).
compatibility: Requires Bun and Git
---

# RavenJS Update Skill

Use this skill when the user wants to update RavenJS in an existing project.

## Step 0 — Verify prerequisites

Run:

```bash
bun --version
git --version
git rev-parse --is-inside-work-tree
git status --porcelain
```

Stop if Bun or Git is unavailable, if the directory is not inside a Git worktree, or if the worktree is dirty.

## Step 1 — Upgrade the project-local CLI

Run:

```bash
bun add -d @raven.js/cli@latest
```

## Step 2 — Verify Raven is initialized

Run:

```bash
bunx raven status
```

If `installed` is `false`, stop and direct the user to use `raven-setup` first.

Use `installDir`, `rootDir`, and `language` from the status output as the live source of truth for the installed Raven core tree.

## Step 3 — Sync the managed Raven assets

Run:

```bash
bunx raven sync
```

`raven sync` rebuilds the managed `raven/core/` tree from embedded source.

## Step 4 — Analyze the update diff

Use Git diff to understand what changed:

```bash
git diff -- package.json bun.lockb bun.lock raven/
```

Then inspect impacted project files as needed:

- search Raven imports and references in project code
- read the updated installed docs from `raven/core/`

## Step 5 — Adapt breaking changes

If the diff shows a breaking change, continue until the project code is adapted:

- update imports, config, and Raven integration code
- read the updated docs before editing
- keep user-facing business logic intact unless the upgrade requires a structural change

## Step 6 — Validate

Run the smallest relevant validation available in the project:

- targeted tests if they exist
- build or typecheck if defined
- a minimal command that verifies Raven integration paths still work

## Step 7 — Report

Tell the user:

- the CLI dependency changes
- the Raven changes under `raven/core/`
- whether any breaking changes were detected
- which project files were adapted
- which validation was run and the result
