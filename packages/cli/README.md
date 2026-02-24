# RavenJS CLI

The RavenJS CLI is designed for **Agent consumption**. AI skills (raven-setup, raven-add, raven-learn, raven-use) invoke it via `bunx raven`. Humans typically run only `bunx raven init`; all other workflows go through skills.

**Install**: Project-local (recommended). Requires Bun `>=1.0`:

```bash
bun add -d @raven.js/cli
```

## Commands

| Command | Description |
|---------|-------------|
| `bunx raven init` | Initialize AI skills and raven root. Run once before using raven-setup. |
| `bunx raven add <module>` | Add a module. Installs dependencies (`dependsOn`) in topological order, copies files, and rewrites `@ravenjs/*` imports to relative paths. |
| `bunx raven status` | Installation status for all modules. Output is JSON for Agent consumption. |

## Options

| Option | Description |
|--------|-------------|
| `--root <dir>` | RavenJS root directory (default: `raven`). Overridable via `RAVEN_ROOT`. |
| `--source <path>` | Local module source path instead of GitHub. Overridable via `RAVEN_SOURCE`. |
| `--registry <path>` | Path to registry JSON (default: bundled with CLI). Overridable via `RAVEN_DEFAULT_REGISTRY_PATH`. |
| `--verbose, -v` | Verbose output. |

