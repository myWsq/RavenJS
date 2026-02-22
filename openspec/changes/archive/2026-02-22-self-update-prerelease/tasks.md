## 1. Dependencies

- [x] 1.1 Add `semver` dependency to `packages/cli/package.json`

## 2. getLatestVersion

- [x] 2.1 Add `includePrerelease?: boolean` parameter to `getLatestVersion()`
- [x] 2.2 When `includePrerelease` is false, keep filtering tags with `!t.includes("-")`
- [x] 2.3 When `includePrerelease` is true, take the first release (no filter)

## 3. Version Comparison

- [x] 3.1 Import `semver` in the Self-Update section
- [x] 3.2 Replace string equality with `semver.gt(latestVersion, currentVersion)` for update decision
- [x] 3.3 Wrap `semver.gt` in try/catch; on invalid versions, treat as "already up to date" or error cleanly

## 4. self-update Command

- [x] 4.1 Add `--prerelease` option to the self-update command
- [x] 4.2 Pass `includePrerelease` from options to `getLatestVersion` in `cmdSelfUpdate`
- [x] 4.3 Extend `CLIOptions` (or command options type) to include `prerelease?: boolean`
