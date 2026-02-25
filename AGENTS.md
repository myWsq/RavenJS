# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

RavenJS is an AI-native Bun web framework (TypeScript monorepo). No databases, Docker, or external services are required.

### Runtime

- **Bun** (>=1.0) is the sole runtime, package manager, and test runner. The lockfile is `bun.lock`.
- Bun is installed at `~/.bun/bin/bun`. Ensure `~/.bun/bin` is on `PATH` (the installer adds it to `~/.bashrc`).

### Key commands

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Lint/format | `npx @biomejs/biome check .` |
| All tests | `bun run test` |
| Unit tests | `bun run test:unit` |
| E2E tests | `bun run test:e2e` |
| Run CLI | `bun run packages/cli/index.ts` |
| Benchmarks | `bun run benchmark` |

See `package.json` `scripts` for the full list.

### Running a dev server

There is no persistent dev server — RavenJS is a framework library, not a standalone app. To test the framework, create a temporary `.ts` file that imports from `modules/core/index.ts`, registers routes on a `Raven` instance, and starts `Bun.serve({ fetch: app.handle.bind(app) })`.

### Gotchas

- Biome is configured with **tab indentation** (`biome.json`). The existing codebase has some pre-existing lint/format warnings in benchmark files (spaces vs tabs, `any` types). These are not regressions.
- The CLI's E2E tests use `--source` to point to local files, so no network access to GitHub is needed for testing.
- `bun run test` runs all tests including E2E CLI tests which create temp directories; this is normal.
