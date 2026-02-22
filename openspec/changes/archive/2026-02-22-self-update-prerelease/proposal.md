## Why

The project uses prerelease versions (e.g., `1.0.0-alpha.3`). The current `raven self-update` only considers stable versions (tags without `-`) and compares versions with string equality, so it cannot correctly handle versions with prerelease suffixes. Users on prerelease builds have no way to update to the latest prerelease via CLI.

## What Changes

- Add `--prerelease` flag to `raven self-update` command
- Without `--prerelease`: only consider stable versions (current behavior)
- With `--prerelease`: consider all versions including prereleases
- Use semver comparison for version checks (only update when `latestVersion > currentVersion`, no downgrade)
- Add `semver` dependency to CLI package

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `self-update`: Add `--prerelease` option; use semver comparison instead of string equality; `getLatestVersion` accepts `includePrerelease` parameter

## Impact

- `packages/cli/package.json`: Add `semver` dependency
- `packages/cli/index.ts`: `getLatestVersion()`, `cmdSelfUpdate()`, self-update command options
