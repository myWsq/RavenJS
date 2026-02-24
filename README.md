<div align="center">

<img src="./docs/logo.webp" alt="RavenJS Logo" width="320" />

RavenJS is an **AI-native** Bun web framework. Lightweight and high-performance.

**Primary audience**: AI Agents (e.g. Claude, Cursor Codex).

</div>

## Philosophy

- **Reference code, not a package**: Code lives in your project as reference—AI Agents learn from it and generate similar code. Copy, modify, and use directly; do not import from npm.
- **Skill-first workflow**: AI skills install, configure, learn, and write RavenJS code. The CLI is invoked via skills—not manually.

## Quick Start

Requires **Bun** `>=1.0`. Use project-local CLI (recommended):

```bash
bun add -d @raven.js/cli
```

**1. Initialize the project**

```bash
bunx raven init
```

This creates `.claude/skills/` with RavenJS AI skills and the raven root (`raven/`, `raven.yaml`).

**2. Complete setup via Agent**

Invoke **raven-setup** (e.g. `/raven-setup`). The Agent adds core, fixes config, and verifies the setup.

**3. Write code via Agent**

Invoke **raven-use** when building (e.g. `/raven-use` create an HTTP server with /hello). The Agent generates and integrates RavenJS code.

## AI Agent Skills

Skills are the primary way to work with RavenJS

| Skill           | When to use                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **raven‑setup** | Project not yet configured for RavenJS. Run after `bunx raven init` to add core, fix config, and verify the runtime.                             |
| **raven‑use**   | Write code with RavenJS (routes, handlers, hooks, validation, state). Triggered when the user wants to build an HTTP server or use RavenJS APIs. |
| **raven‑add**   | Add a new module (e.g. jtd-validator). Use when the project is already initialized.                                                              |
| **raven‑learn** | Load and study a module's API, architecture, and design decisions. Run before writing code that uses the module.                                 |

Skills invoke the CLI via `bunx raven`.

## Available Modules

| Module          | Description                                                                                    | Docs                                      |
| --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `core`          | Logic layer (`handle`), routing, lifecycle hooks, state management, plugin system.             | [README](modules/core/README.md)          |
| `jtd‑validator` | JTD (JSON Type Definition) validator for request bodies, params, and query. Depends on `core`. | [README](modules/jtd-validator/README.md) |

## CLI

The CLI is intended for **Agent use**. Skills invoke it via `bunx raven`. If you need command details, options, or output format, see [packages/cli/README.md](packages/cli/README.md).

## Updating

TODO: Add update instructions.

### CLI

```bash
bun add -d @raven.js/cli@latest
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

Use `--registry` or `RAVEN_DEFAULT_REGISTRY_PATH` so E2E tests use a local `registry.json` instead of GitHub.

## Release

Push a version tag to trigger the release workflow. The CLI is published to npm as `@raven.js/cli`.

```bash
git tag v1.0.0
git push origin v1.0.0
```

Requires `NPM_TOKEN` in GitHub Secrets.

## License

See repository for license information.
