# Release Specification

> **Migration Note**: This spec consolidates following original specs:
> - `binary-release-workflow`
> - `cross-platform-install-scripts`
> - `cli-prebuild-release-trigger`
>
> **Update (cli-bun-release)**: Replaced cross-platform binary builds with single Bun bundle; single job workflow.

## Purpose

定义 RavenJS 发布相关的所有规范，包括 CLI 构建、发布工作流等。CLI 使用 Bun 打包为单文件 JS，单一包发布到 npm。

## Requirements

### Requirement: Release tag triggers workflow

GitHub Actions SHALL run release workflow when a tag matching v* (e.g., v1.2.3) is pushed.

#### Scenario: Tag push triggers release
- **WHEN** a tag v1.2.3 is pushed to repository
- **THEN** release workflow starts

#### Scenario: Non-version tag does not trigger release
- **WHEN** a tag not matching v*.*.* pattern is pushed
- **THEN** release workflow does not start

### Requirement: Build version sourced from tag

The CLI build step SHALL use release tag version as its build version.

#### Scenario: Build receives version from tag
- **WHEN** release workflow is triggered by tag v1.2.3
- **THEN** CLI build version is set to 1.2.3

#### Scenario: Version propagation is consistent
- **WHEN** workflow computes release version from tag
- **THEN** same version value SHALL be passed to build and publish steps

### Requirement: Release workflow triggers on version tags

The system SHALL trigger the release workflow when a tag matching the pattern `v*.*.*` is pushed to the repository.

#### Scenario: Push version tag triggers release
- **WHEN** a tag matching `v1.0.0` pattern is pushed
- **THEN** the release workflow SHALL start automatically

#### Scenario: Non-version tag does not trigger release
- **WHEN** a tag not matching version pattern is pushed (e.g., `beta`)
- **THEN** the release workflow SHALL NOT start

### Requirement: Build uses Bun bundle

The system SHALL use `bun build` (without `--compile`) to generate a single JS bundle runnable by Bun runtime, instead of standalone binaries.

#### Scenario: Build produces JS bundle
- **WHEN** release workflow runs
- **THEN** output SHALL be a single JS file (e.g., dist/raven.js)
- **AND** the file SHALL be executable via Bun (shebang `#!/usr/bin/env bun`)
- **AND** the build SHALL use `--minify` and `--target=bun` for reduced file size

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
