# RavenJS CLI

The RavenJS CLI is designed for **Agent consumption**. AI skills (raven-setup, raven-add, raven-learn, raven-use) invoke it via `bunx raven`. To get skills into your project, use **install-raven** (e.g. `npx install-raven`); then run `bunx raven init` to create the raven root, or let raven-setup do it.

**Install**: Project-local (recommended). Requires Bun `>=1.0`:

```bash
bun add -d @raven.js/cli
```

## Commands

| Command | Description |
|---------|-------------|
| `bunx raven init` | Initialize raven root. |
| `bunx raven add <module>` | Add a module. Installs dependencies (`dependsOn`) in topological order, copies files, and rewrites `@ravenjs/*` imports to relative paths. |
| `bunx raven status` | Installation status for all modules. Output is JSON for Agent consumption. |

## Options

| Option | Description |
|--------|-------------|
| `--root <dir>` | RavenJS root directory (default: `raven`). Overridable via `RAVEN_ROOT`. |
| `--source <path>` | Local module source path instead of GitHub. Overridable via `RAVEN_SOURCE`. |
| `--registry <path>` | Path to registry JSON (default: bundled with CLI). Overridable via `RAVEN_DEFAULT_REGISTRY_PATH`. |
| `--verbose, -v` | Verbose output. |

