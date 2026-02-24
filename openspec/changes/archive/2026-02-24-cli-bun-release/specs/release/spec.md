# Release Specification (Delta)

## MODIFIED Requirements

### Requirement: Build uses Bun bundle

The system SHALL use `bun build` (without `--compile`) to generate a single JS bundle runnable by Bun runtime, instead of standalone binaries.

#### Scenario: Build produces JS bundle
- **WHEN** release workflow runs
- **THEN** output SHALL be a single JS file (e.g., dist/raven.js)
- **AND** the file SHALL be executable via Bun (shebang `#!/usr/bin/env bun`)
- **AND** the build SHALL use `--minify` for reduced file size

#### Scenario: No binary compilation
- **WHEN** release workflow runs
- **THEN** the build SHALL NOT use `--compile`
- **AND** no native binary files SHALL be produced

### Requirement: Single-platform release workflow

The release workflow SHALL build and publish from a single runner (e.g., ubuntu-latest), without matrix strategy for multiple platforms.

#### Scenario: Single job build
- **WHEN** release workflow runs
- **THEN** build SHALL run on one platform only (e.g., ubuntu-latest)
- **AND** no matrix for linux-x64, darwin-arm64, etc. SHALL be used

#### Scenario: Version propagation is consistent
- **WHEN** workflow computes release version from tag
- **THEN** same version value SHALL be passed to build and publish steps

## REMOVED Requirements

### Requirement: Cross-platform binary builds

**Reason**: CLI is now published as a single JS bundle that runs on Bun, no platform-specific binaries.

**Migration**: N/A. Users install @raven.js/cli and run via Bun.

### Requirement: Binary naming convention

**Reason**: No binaries are produced; bundle uses fixed output name (e.g., dist/raven.js).

**Migration**: N/A.

### Requirement: Build uses Bun compile

**Reason**: Replaced by "Build uses Bun bundle" above.

**Migration**: N/A.
