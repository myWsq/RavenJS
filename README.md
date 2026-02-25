<div align="center">

<img src="./docs/logo.webp" alt="RavenJS Logo" width="320" />

RavenJS is an **AI-native** Bun web framework. Lightweight and high-performance.

**Primary audience**: AI Agents (e.g. Claude, Cursor Codex).

</div>

## Philosophy

- **Reference code, not a package**: Code lives in your project as reference—AI Agents learn from it and generate similar code. Copy, modify, and use directly; do not import from npm.
- **Skill-first workflow**: AI skills install, configure, learn, and write RavenJS code. The CLI is invoked via skills—not manually.

## Quick Start

Requires **Bun** `>=1.0`.

**1. Install RavenJS skills**

```bash
npx install-raven
```

This installs AI skills into `.claude/skills/`. It does not install the CLI or create the raven directory.

**2. Complete setup via Agent**

```
/raven-setup
```

Agent will add `@raven.js/cli` to the project, run `raven init`, add core, and verify the setup.

**Alternative:** Install the CLI first, then init: `bun add -d @raven.js/cli` and `bunx raven init`. Install skills with `npx install-raven` if you need them.

**3. Write code via Agent**

```
/raven-use create an HTTP server with /hello
```

Agent will generate and integrate RavenJS code.

## AI Agent Skills

Skills are the primary way to work with RavenJS

| Skill           | When to use                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **raven‑setup** | Project not yet configured for RavenJS. Run after installing skills (e.g. `npx install-raven`) to add CLI, init, core, and verify the runtime.   |
| **raven‑use**   | Write code with RavenJS (routes, handlers, hooks, validation, state). Triggered when the user wants to build an HTTP server or use RavenJS APIs. |
| **raven‑add**   | Add a new module (e.g. core). Use when the project is already initialized.                                                              |
| **raven‑learn** | Load and study a module's API, architecture, and design decisions. Run before writing code that uses the module.                                 |

## Available Modules

| Module          | Description                                                                                    | Docs                                      |
| --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `core` | RavenJS core framework providing HTTP services, routing, hooks, and state management. Designed for building web services and handling request/response cycles. | [README](modules/core/README.md) |
| `schema‑validator` | Validation helper based on Standard Schema. Use this module when you need to validate request data (body, query, params, headers) using Zod, Valibot, or ArkType, and want type-safe context in handlers. | [README](modules/schema-validator/README.md) |
| `sql` | RavenJS SQL module providing SQL database integration. Use this module when you need to interact with a SQL database. | [README](modules/sql/README.md) |

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
