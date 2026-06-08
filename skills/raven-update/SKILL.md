---
name: raven-update
description: Upgrade the @raven.js/core npm dependency, read the CHANGELOG / migration notes, adapt project code for breaking changes, and validate. Only trigger when explicitly invoked by name (e.g. "use raven-update" or called from another skill).
compatibility: Requires a package manager and Git
---

# RavenJS Update Skill

Use this skill when the user wants to upgrade RavenJS (`@raven.js/core`) in an existing project.

> RavenJS 3.x is a standard npm dependency. Upgrading is a normal package bump — there is no `raven sync` and no managed source tree to rebuild.

## Step 0 — Verify prerequisites

```bash
git --version
git rev-parse --is-inside-work-tree
git status --porcelain
```

Stop if Git is unavailable, the directory is not a Git worktree, or the worktree is dirty (a clean tree makes the upgrade diff reviewable).

## Step 1 — Record the current version

Read the installed version before upgrading:

```bash
node -e "console.log(require('@raven.js/core/package.json').version)"
```

## Step 2 — Upgrade the dependency

Upgrade with the project's package manager (keep the `hono` peer compatible):

```bash
npm install @raven.js/core@latest
# or: pnpm up / yarn upgrade / bun update
```

The resulting `package.json` / lockfile changes are expected output of this step.

## Step 3 — Read the changelog / migration notes

Read what changed for the new version:

- `node_modules/@raven.js/core/README.md` and `GUIDE.md` (installed version's docs)
- the project's `MIGRATION.md` guidance or the RavenJS repo `MIGRATION.md` for major upgrades (e.g. 2.x → 3.x)
- if `hono`'s required peer range changed, update `hono` accordingly

## Step 4 — Adapt breaking changes

If the upgrade is a major version or the notes list breaking changes, continue until project code is adapted:

- update imports, config, and integration code (e.g. serve entry, contract/handler signatures)
- read the updated installed docs before editing
- keep user-facing business logic intact unless the upgrade requires a structural change

Common 3.x breaking points to check: serve uses `await app.ready()` (not `app.handle`); trailing-slash is strict; path params are URL-decoded; `/path/*` wildcard matches more broadly; `beforeResponse` errors now flow through `onError`.

## Step 5 — Validate

Run the smallest relevant validation:

- targeted tests if they exist
- build / typecheck if defined
- a minimal request through `await app.ready()` that exercises a known route

## Step 6 — Report

Tell the user:

- the version change (from → to) and any `hono` peer change
- whether breaking changes were detected
- which project files were adapted
- which validation was run and its result
