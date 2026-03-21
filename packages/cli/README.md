# RavenJS CLI

The RavenJS CLI is designed for **Agent consumption**. AI skills (`raven-setup`, `raven-learn`, `raven-use`, `raven-update`) invoke it via `bunx raven`. To get skills into your project, use **install-raven** (e.g. `npx install-raven`); then run `bunx raven init` to create the raven root and install the managed core tree, or let `raven-setup` do it.

**Install** (project-local, recommended). Requires Bun `>=1.0`:

```bash
bun add -d @raven.js/cli
```

## Commands

| Command                     | Description                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bunx raven init`           | Initialize the Raven root, write `raven.yaml`, and install the managed `core/` reference tree.                                                            |
| `bunx raven sync`           | Rebuild the managed `core/` tree from the embedded source, removing legacy module dirs atomically. Requires a Git worktree and clean managed Raven paths. |
| `bunx raven status`         | Show RavenJS installation status for the single managed core tree. Output is JSON for Agent consumption.                                                  |
| `bunx raven build-contract` | Build distributable contract artifacts (`raven-contract.json`, `openapi.json`, `openapi.yml`) from backend raw contracts.                                 |

## Options

| Option              | Description                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--root <dir>`      | RavenJS root directory (default: `raven`). Overridable via `RAVEN_ROOT`.                                         |
| `--registry <path>` | Path to embedded-source manifest JSON (default: same dir as CLI). Overridable via `RAVEN_DEFAULT_REGISTRY_PATH`. |
| `--verbose, -v`     | Verbose output.                                                                                                  |

`build-contract` also supports:

| Option            | Description                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| `--config <path>` | Path to `raven.contract.json` (default: `./raven.contract.json`).         |
| `--watch`         | Watch configured contract sources and rebuild artifacts when they change. |

## Offline behavior

The CLI embeds the managed core source at build time (`dist/source/core/`). `raven init` and `raven sync` read only from this embedded source and do not perform network requests.

`raven build-contract` reads local backend contract source and writes local artifact files. It does not require network access.

## Contract Artifact Build

Use `raven build-contract` when frontend or external consumers should depend on a generated artifact instead of importing backend raw contract source.

Recommended monorepo shape:

```text
apps/
  backend/
    tsconfig.json
    src/interface/**\/*.contract.ts

packages/
  backend-contract/
    package.json
    raven.contract.json
    dist/
```

Example `packages/backend-contract/raven.contract.json`:

```json
{
  "backend": {
    "tsconfig": "../../apps/backend/tsconfig.json",
    "contracts": ["../../apps/backend/src/interface/**/*.contract.ts"]
  },
  "outDir": "./dist",
  "openapi": {
    "title": "Backend API",
    "version": "1.0.0"
  }
}
```

Run from the contract package:

```bash
bunx raven build-contract
```

Generated files:

- `dist/raven-contract.json`: canonical Raven contract bundle for downstream tooling
- `dist/openapi.json`: OpenAPI 3.0 JSON document
- `dist/openapi.yml`: OpenAPI 3.0 YAML document

During local development:

```bash
bunx raven build-contract --watch
```

This keeps the contract package as the distribution boundary while leaving backend raw contract files as the authoring source of truth.

## Recommended update flow

Use the `raven-update` skill as the default RavenJS upgrade entry point:

1. Verify the Git worktree is clean before starting the upgrade
2. `bun add -d @raven.js/cli@latest`
3. `bunx raven sync`
4. Analyze the resulting Git diff and adapt project code if the update introduces breaking changes

The skill performs this flow for the Agent and enforces the safety checks in the right order.

## Sync semantics

`raven sync` treats `<root>/core/` as CLI-managed Raven assets. It recreates the managed directory from the embedded source, removes files that no longer exist in the embedded source, removes legacy top-level module directories such as `sql/`, and swaps the rebuilt root into place only after staging succeeds.

`raven sync` refuses to run unless the current directory is inside a Git worktree and the managed Raven paths are clean. The protected paths are `<root>/raven.yaml`, `<root>/core/`, and legacy managed directories that sync will delete. Unrelated repo edits such as `package.json`, lockfiles, app source, or passthrough files under `<root>/` do not block sync.
