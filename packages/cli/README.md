# RavenJS CLI

The RavenJS CLI is designed for **Agent consumption**. AI skills (raven-setup, raven-add, raven-learn, raven-use) invoke it via `bunx raven`. To get skills into your project, use **install-raven** (e.g. `npx install-raven`); then run `bunx raven init` to create the raven root, or let raven-setup do it.

**Install** (project-local, recommended). Requires Bun `>=1.0`:

```bash
bun add -d @raven.js/cli
```

## Commands

| Command | Description |
|---------|-------------|
| `bunx raven init` | Initialize raven root (directory and `raven.yaml`). Install AI skills with install-raven first. |
| `bunx raven add <module>` | Add a module (e.g. `core`). Reads from **embedded source** (no network). Installs `dependsOn` in topological order, copies files, and rewrites `@ravenjs/*` / `@raven.js/*` imports to relative paths. |
| `bunx raven status` | Show RavenJS installation status (core, modules). Output is JSON for Agent consumption. |

## Options

| Option | Description |
|--------|-------------|
| `--root <dir>` | RavenJS root directory (default: `raven`). Overridable via `RAVEN_ROOT`. |
| `--registry <path>` | Path to registry JSON (default: same dir as CLI). Overridable via `RAVEN_DEFAULT_REGISTRY_PATH`. |
| `--verbose, -v` | Verbose output. |

## Offline behavior

The CLI embeds module source at build time (`dist/source/<module>/`). `raven add <module>` reads from this embedded source and does not perform any network requests.

