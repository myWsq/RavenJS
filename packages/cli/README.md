# RavenJS CLI

The RavenJS CLI is designed for **Agent consumption**. AI skills (raven-setup, raven-add, raven-learn, raven-use) invoke it via `bunx raven`. Humans typically run only `bunx raven init`; all other workflows go through skills.

## Commands

| Command | Description |
|---------|-------------|
| `bunx raven init` | Initialize AI skills and raven root. Run once before using raven-setup. |
| `bunx raven add <module>` | Add a module. Installs dependencies (`dependsOn`) in topological order, copies files, and rewrites `@ravenjs/*` imports to relative paths. |
| `bunx raven status` | Installation status for all modules. Output is JSON for Agent consumption. |
| `bunx raven guide <module>` | Output README and source for a module. Used by raven-learn. |

## Options

| Option | Description |
|--------|-------------|
| `--root <dir>` | RavenJS root directory (default: `raven`). Overridable via `RAVEN_ROOT`. |
| `--source <path>` | Local module source path instead of GitHub. Overridable via `RAVEN_SOURCE`. |
| `--registry <path>` | Path to registry JSON (default: bundled with CLI). Overridable via `RAVEN_DEFAULT_REGISTRY_PATH`. |
| `--verbose, -v` | Verbose output. |

## Agent-facing output

All commands except `raven init` and `raven guide` output JSON by default. `raven status` includes version info, file hashes, and modified file status for Agent decision-making.
