## Why

The CLI's `raven self-update` command currently only prints instructions to manually run npm/bunx. Users expect a one-command self-update that automatically downloads and installs the latest binary, matching the behavior of the existing `install.sh` script. Completing this feature improves UX and aligns CLI behavior with the documented install flow.

## What Changes

- Replace the placeholder `cmdSelfUpdate` implementation with real self-update logic
- Detect OS (linux/darwin) and architecture (x64/arm64) to select the correct binary
- Fetch latest version from GitHub Releases API (same source as install.sh)
- Download the prebuilt binary from `https://github.com/myWsq/RavenJS/releases/download/v{version}/raven-{version}-{os}-{arch}`
- Replace the running binary in-place (or write to install path when running from npx/bunx)
- Display "Already up to date" when current version matches latest
- Display success/error messages consistent with install.sh semantics

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `self-update`: Extend requirements so the CLI SHALL perform the update automatically by downloading from GitHub Releases and replacing the binary, following the same logic as install.sh (OS/arch detection, GitHub API, download URL pattern, install path).

## Impact

- `packages/cli/index.ts`: Major changes to `cmdSelfUpdate`, new helpers for version check, download, and binary replacement
- Dependencies: Uses Bun's `fetch` and `Bun.write` (no new deps)
- install.sh logic is the reference for URL format, detection, and error handling
