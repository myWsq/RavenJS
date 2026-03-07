<div align="center">

<img src="./docs/logo.webp" alt="RavenJS Logo" width="320" />

RavenJS is an **AI-native** Bun web framework. Lightweight and high-performance.

**Primary audience**: AI Agents (e.g. Claude, Cursor Codex).

</div>

## Philosophy

- **Reference code, not a package**: Code lives in your project as reference—AI Agents learn from it and generate similar code. Copy, modify, and use directly; do not import from npm.
- **Skill-first workflow**: AI skills install, configure, learn, and write RavenJS code. The CLI is invoked via skills—not manually.

## Quick Start

Requires **Bun** `>=1.0`. Raven installs in your **project directory**—framework code is copied in as reference for AI agents to learn from.

**0. New project?**

Use [bun init](https://bun.com/docs/runtime/templating/init) first. RavenJS supports **server-only** (`bun init -y`) or [Full Stack Dev Server](https://bun.sh/docs/bundler/fullstack) (`bun init --react`, `bun init --react=tailwind`, etc.).

**1. Install AI skills**

```bash
bunx install-raven
```

**2. Complete setup via Agent**

```
/raven-setup
```

The Agent will install the CLI (if missing), initialize the raven root, add core, and verify the setup.

**3. Write code via Agent**

```
/raven-use create an HTTP server with /hello
```

## AI Skills

Work with RavenJS primarily through skills.

| Skill           | When to use                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **raven‑setup** | Project not yet set up for RavenJS.                                                                                                                    |
| **raven‑use**   | Write application code with RavenJS (routes, handlers, hooks, validation, state). Use when the user wants to build an HTTP server or use RavenJS APIs. |
| **raven‑add**   | Add a module (e.g. core) to an already initialized project. Use only after `raven init` has been run.                                                  |
| **raven‑learn** | Learn a module’s API, architecture, and design. Run before writing code that depends on that module.                                                   |

## Available Modules

| Module | Description                                                                                                                        | Docs                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `core` | RavenJS core framework providing HTTP services, routing, hooks, state management, and built-in Standard Schema request validation. | [README](modules/core/README.md) |
| `sql`  | RavenJS SQL module providing SQL database integration. Use this module when you need to interact with a SQL database.              | [README](modules/sql/README.md)  |

## CLI

The CLI is intended for **Agent use**. Skills invoke it via `bunx raven`. For command details, options, and output format see [packages/cli/README.md](packages/cli/README.md). Modules are installed from the CLI’s embedded source; no network fetch is required.

## Updating

- **CLI**: Upgrade to the latest in your project:
  ```bash
  bun add -d @raven.js/cli@latest
  ```
- **AI skills**: Re-run to overwrite with the latest skill content:
  ```bash
  npx install-raven
  ```

## Development

### Prerequisites

- [Bun](https://bun.sh) `>=1.0` (for development)

### Setup

```bash
bun install
```

### Run CLI locally

```bash
bun run packages/cli/index.ts
```

### Tests

```bash
bun test
bun run test:unit
bun run test:integration
bun run test:e2e
```

### Benchmarks

```bash
bun run benchmark
bun run benchmark:micro
bun run benchmark:e2e
bun run benchmark:compare
```

### Local registry

Use `--registry` or `RAVEN_DEFAULT_REGISTRY_PATH` so E2E tests use a local `registry.json`.

## Release

Push a version tag to trigger the release workflow. The CLI is published to npm as `@raven.js/cli`.

```bash
git tag v1.0.0
git push origin v1.0.0
```

Requires `NPM_TOKEN` in GitHub Secrets.

## License

See repository for license information.
