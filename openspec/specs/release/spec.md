# Release Specification

> **Migration Note**: This spec consolidates following original specs:
> - `binary-release-workflow`
> - `cross-platform-install-scripts`
> - `cli-prebuild-release-trigger`

## Purpose

定义 RavenJS 发布相关的所有规范，包括二进制构建、跨平台安装脚本、发布工作流等。

## Requirements

### Requirement: Release tag triggers workflow

GitHub Actions SHALL run release workflow only when a tag matching v<x.x.x> is pushed.

#### Scenario: Tag push triggers release

- **WHEN** a tag v1.2.3 is pushed to repository
- **THEN** release workflow starts

#### Scenario: Non-version tag does not trigger release

- **WHEN** a tag not matching v<x.x.x> is pushed
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

The system SHALL trigger the release workflow when a tag matching the pattern `@ravenjs/cli@v*.*.*` is pushed to the repository.

#### Scenario: Push CLI version tag triggers release

- **WHEN** a tag matching `@ravenjs/cli@v1.0.0` pattern is pushed
- **THEN** the release workflow SHALL start automatically

#### Scenario: Non-CLI package tag does not trigger CLI release

- **WHEN** a tag for another package is pushed (e.g., `@ravenjs/core@v1.0.0`)
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

### Requirement: GitHub Release creation

The system SHALL create a GitHub Release with all compiled binaries as assets when the workflow completes successfully.

#### Scenario: Release created with all binaries

- **WHEN** all platform builds complete successfully
- **THEN** a GitHub Release SHALL be created with all binaries attached as downloadable assets

#### Scenario: Release includes version in title

- **WHEN** release is created for tag v1.0.0
- **THEN** the release title SHALL include the version number

### Requirement: Build uses Bun compile

The system SHALL use `bun build --compile --minify` to generate standalone binaries.

#### Scenario: Binary is standalone executable

- **WHEN** binary is compiled
- **THEN** it SHALL be a standalone executable with no external runtime dependencies

#### Scenario: Binary is minified

- **WHEN** binary is compiled
- **THEN** the output SHALL be minified for reduced file size

### Requirement: Shell script for Unix-like systems

The system SHALL provide a shell script (install.sh) that works on Linux and macOS.

#### Scenario: Shell script runs on Linux

- **WHEN** user runs install.sh on Linux
- **THEN** the script SHALL execute without errors

#### Scenario: Shell script runs on macOS

- **WHEN** user runs install.sh on macOS
- **THEN** the script SHALL execute without errors

### Requirement: PowerShell script for Windows

The system SHALL provide a PowerShell script (install.ps1) that works on Windows.

#### Scenario: PowerShell script runs on Windows

- **WHEN** user runs install.ps1 on Windows
- **THEN** the script SHALL execute without errors

### Requirement: OS and architecture detection

The install scripts SHALL automatically detect the user's operating system and CPU architecture.

#### Scenario: Detect Linux x64

- **WHEN** script runs on Linux x64
- **THEN** it SHALL identify OS as "linux" and arch as "x64"

#### Scenario: Detect Linux ARM64

- **WHEN** script runs on Linux ARM64
- **THEN** it SHALL identify OS as "linux" and arch as "arm64"

#### Scenario: Detect macOS Intel

- **WHEN** script runs on macOS Intel
- **THEN** it SHALL identify OS as "darwin" and arch as "x64"

#### Scenario: Detect macOS Apple Silicon

- **WHEN** script runs on macOS Apple Silicon
- **THEN** it SHALL identify OS as "darwin" and arch as "arm64"

#### Scenario: Detect Windows x64

- **WHEN** script runs on Windows x64
- **THEN** it SHALL identify OS as "windows" and arch as "x64"

### Requirement: Download latest version by default

The install scripts SHALL download the latest released version by default.

#### Scenario: Download latest version

- **WHEN** user runs script without version argument
- **THEN** it SHALL download the latest available version from GitHub Releases

### Requirement: Support specific version installation

The install scripts SHALL allow users to specify a particular version to install.

#### Scenario: Install specific version

- **WHEN** user runs script with version argument (e.g., v1.0.0)
- **THEN** it SHALL download and install that exact version

### Requirement: Install to standard location

The install scripts SHALL install the binary to a standard user-specific location.

#### Scenario: Install to ~/.local/bin on Unix

- **WHEN** shell script completes successfully
- **THEN** binary SHALL be installed at ~/.local/bin/raven

#### Scenario: Install to %LOCALAPPDATA%\raven on Windows

- **WHEN** PowerShell script completes successfully
- **THEN** binary SHALL be installed at %LOCALAPPDATA%\raven\raven.exe

### Requirement: Binary executable permission

The install scripts SHALL make the binary executable after download.

#### Scenario: Set executable permission on Unix

- **WHEN** shell script installs binary
- **THEN** it SHALL set executable permissions (chmod +x)

### Requirement: Error handling

The install scripts SHALL handle common errors and provide user-friendly messages.

#### Scenario: Unsupported OS

- **WHEN** script runs on unsupported OS
- **THEN** it SHALL display error message and exit with non-zero code

#### Scenario: Unsupported architecture

- **WHEN** script runs on unsupported architecture
- **THEN** it SHALL display error message and exit with non-zero code

#### Scenario: Network failure

- **WHEN** download fails due to network issue
- **THEN** it SHALL display error message and exit with non-zero code

#### Scenario: Permission denied

- **WHEN** script cannot write to install location
- **THEN** it SHALL display error message and exit with non-zero code

### Requirement: Clean up partial downloads

The install scripts SHALL clean up partially downloaded files if installation fails.

#### Scenario: Clean up on failure

- **WHEN** installation fails
- **THEN** it SHALL remove any partially downloaded files
