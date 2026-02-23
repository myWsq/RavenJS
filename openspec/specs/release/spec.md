# Release Specification

> **Migration Note**: This spec consolidates following original specs:
> - `binary-release-workflow`
> - `cross-platform-install-scripts`
> - `cli-prebuild-release-trigger`

## Purpose

定义 RavenJS 发布相关的所有规范，包括二进制构建、跨平台安装脚本、发布工作流等。

## Requirements

### Requirement: Release tag triggers workflow

GitHub Actions SHALL run release workflow when a tag matching @raven.js/cli@v<x.x.x> is pushed.

#### Scenario: Tag push triggers release
- **WHEN** a tag @raven.js/cli@v1.2.3 is pushed to repository
- **THEN** release workflow starts

#### Scenario: Non-version tag does not trigger release
- **WHEN** a tag not matching @raven.js/cli@v<x.x.x> is pushed
- **THEN** release workflow does not start

### Requirement: Prebuild version sourced from tag

The CLI prebuild step SHALL use release tag version as its build version.

#### Scenario: Prebuild receives version from tag

- **WHEN** release workflow is triggered by tag v1.2.3
- **THEN** CLI prebuild version is set to 1.2.3

#### Scenario: Version propagation is consistent

- **WHEN** workflow computes release version
- **THEN** same version value is passed to all CLI prebuild steps

### Requirement: Release workflow triggers on package-scoped version tags

The system SHALL trigger the release workflow when a tag matching the pattern `@raven.js/cli@v*.*.*` is pushed to the repository.

#### Scenario: Push CLI version tag triggers release
- **WHEN** a tag matching `@raven.js/cli@v1.0.0` pattern is pushed
- **THEN** the release workflow SHALL start automatically

#### Scenario: Non-CLI package tag does not trigger CLI release
- **WHEN** a tag for another package is pushed (e.g., `@raven.js/core@v1.0.0`)
- **THEN** the CLI release workflow SHALL NOT start

#### Scenario: Non-version tag does not trigger release
- **WHEN** a tag not matching package version pattern is pushed (e.g., `beta`, `v1.0.0`)
- **THEN** the release workflow SHALL NOT start

### Requirement: Cross-platform binary builds

The system SHALL build CLI binaries for multiple target platforms: Linux (x64, ARM64), macOS (x64, ARM64), and Windows (x64).

#### Scenario: Build Linux x64 binary

- **WHEN** release workflow runs
- **THEN** a binary for linux-x64 platform SHALL be compiled

#### Scenario: Build Linux ARM64 binary

- **WHEN** release workflow runs
- **THEN** a binary for linux-arm64 platform SHALL be compiled

#### Scenario: Build macOS x64 binary

- **WHEN** release workflow runs
- **THEN** a binary for darwin-x64 platform SHALL be compiled

#### Scenario: Build macOS ARM64 binary

- **WHEN** release workflow runs
- **THEN** a binary for darwin-arm64 platform SHALL be compiled

#### Scenario: Build Windows x64 binary

- **WHEN** release workflow runs
- **THEN** a binary for windows-x64 platform SHALL be compiled with .exe extension

### Requirement: Binary naming convention

The system SHALL name binaries using the format `raven-{version}-{os}-{arch}[.exe]`.

#### Scenario: Linux binary naming

- **WHEN** building for linux-x64 with version 1.0.0
- **THEN** the binary SHALL be named `raven-1.0.0-linux-x64`

#### Scenario: macOS ARM64 binary naming

- **WHEN** building for darwin-arm64 with version 1.0.0
- **THEN** the binary SHALL be named `raven-1.0.0-darwin-arm64`

#### Scenario: Windows binary naming with extension

- **WHEN** building for windows-x64 with version 1.0.0
- **THEN** the binary SHALL be named `raven-1.0.0-windows-x64.exe`

### Requirement: Build uses Bun compile

The system SHALL use `bun build --compile --minify` to generate standalone binaries.

#### Scenario: Binary is standalone executable

- **WHEN** binary is compiled
- **THEN** it SHALL be a standalone executable with no external runtime dependencies

#### Scenario: Binary is minified

- **WHEN** binary is compiled
- **THEN** the output SHALL be minified for reduced file size
