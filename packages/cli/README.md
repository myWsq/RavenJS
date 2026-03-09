# RavenJS CLI

The RavenJS CLI is designed for **Agent consumption**. AI skills (`raven-setup`, `raven-learn`, `raven-use`, `raven-update`) invoke it via `bunx raven`. To get skills into your project, use **install-raven** (e.g. `npx install-raven`); then run `bunx raven init` to create the raven root and install the managed core tree, or let `raven-setup` do it.

**Install** (project-local, recommended). Requires Bun `>=1.0`:

```bash
bun add -d @raven.js/cli
```

## Commands

| Command             | Description                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bunx raven init`   | Initialize the Raven root, write `raven.yaml`, install the managed `core/` reference tree, and install examples.                                         |
| `bunx raven sync`   | Rebuild the managed `core/` tree and `examples/` assets from the embedded source, removing legacy module dirs atomically. Requires a clean Git worktree. |
| `bunx raven status` | Show RavenJS installation status for the single managed core tree. Output is JSON for Agent consumption.                                                 |

## Options

| Option              | Description                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--root <dir>`      | RavenJS root directory (default: `raven`). Overridable via `RAVEN_ROOT`.                                         |
| `--registry <path>` | Path to embedded-source manifest JSON (default: same dir as CLI). Overridable via `RAVEN_DEFAULT_REGISTRY_PATH`. |
| `--verbose, -v`     | Verbose output.                                                                                                  |

## Offline behavior

The CLI embeds the managed core source and example assets at build time (`dist/source/core/`, `dist/source/examples/`). `raven init` and `raven sync` read only from this embedded source and do not perform network requests.

## Recommended update flow

Use the `raven-update` skill as the default RavenJS upgrade entry point:

1. `bun add -d @raven.js/cli@latest`
2. `bunx raven sync`
3. Analyze the resulting Git diff and adapt project code if the update introduces breaking changes

The skill performs this flow for the Agent and enforces the safety checks in the right order.

## Sync semantics

`raven sync` treats `<root>/core/` and `<root>/examples/` as CLI-managed Raven assets. It recreates those managed directories from the embedded source, removes files that no longer exist in the embedded source, removes legacy top-level module directories such as `sql/`, and swaps the rebuilt root into place only after staging succeeds.

`raven sync` refuses to run unless the current directory is inside a Git worktree and the worktree is clean. This keeps the post-sync diff attributable to the update itself and avoids mixing framework regeneration with unrelated local edits.
