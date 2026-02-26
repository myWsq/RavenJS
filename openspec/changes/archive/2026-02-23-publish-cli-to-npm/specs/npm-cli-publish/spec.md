# npm-cli-publish Specification

## Purpose

定义通过 npm 发布 @raven.js/cli 的规范，包括平台特定子包机制、主包包装脚本和 GitHub Actions 工作流。

## Requirements

### Requirement: Platform-specific npm packages

The system SHALL publish platform-specific npm packages for each supported target.

#### Scenario: Linux x64 package published

- **WHEN** release workflow runs for linux-x64
- **THEN** @raven.js/cli-linux-x64 package SHALL be published to npm

#### Scenario: Linux ARM64 package published

- **WHEN** release workflow runs for linux-arm64
- **THEN** @raven.js/cli-linux-arm64 package SHALL be published to npm

#### Scenario: macOS x64 package published

- **WHEN** release workflow runs for darwin-x64
- **THEN** @raven.js/cli-darwin-x64 package SHALL be published to npm

#### Scenario: macOS ARM64 package published

- **WHEN** release workflow runs for darwin-arm64
- **THEN** @raven.js/cli-darwin-arm64 package SHALL be published to npm

#### Scenario: Windows x64 package published

- **WHEN** release workflow runs for windows-x64
- **THEN** @raven.js/cli-windows-x64 package SHALL be published to npm

### Requirement: Platform-specific package structure

Each platform-specific package SHALL contain:

- package.json with os and cpu fields
- package.json with keywords and repository fields
- README.md file
- The compiled binary
- bin field pointing to the binary

#### Scenario: Linux package has correct fields

- **WHEN** @raven.js/cli-linux-x64 is published
- **THEN** package.json SHALL have "os": ["linux"] and "cpu": ["x64"]
- **AND** package.json SHALL have keywords and repository fields
- **AND** bin field SHALL point to "./raven"
- **AND** files array SHALL include "raven" and "README.md"
- **AND** README.md file SHALL be present

#### Scenario: Windows package has .exe extension

- **WHEN** @raven.js/cli-windows-x64 is published
- **THEN** bin field SHALL point to "./raven.exe"
- **AND** files array SHALL include "raven.exe" and "README.md"

### Requirement: Main package includes metadata and README

The main @raven.js/cli package SHALL include keywords, repository fields, and README.md.

#### Scenario: Main package has metadata

- **WHEN** @raven.js/cli is published
- **THEN** package.json SHALL have keywords and repository fields
- **AND** README.md file SHALL be present

### Requirement: Main package with optionalDependencies

The main @raven.js/cli package SHALL declare all platform-specific packages as optionalDependencies.

#### Scenario: Main package has optionalDependencies

- **WHEN** @raven.js/cli is published
- **THEN** optionalDependencies SHALL include all 5 platform-specific packages
- **AND** each optional dependency SHALL have the exact same version as the main package

### Requirement: Main package wrapper script

The main @raven.js/cli package SHALL include a wrapper script that finds and executes the platform-specific binary.

#### Scenario: Wrapper finds correct binary

- **WHEN** user runs "raven" command
- **THEN** wrapper script SHALL find the installed platform-specific binary
- **AND** execute it with all arguments passed through

#### Scenario: No binary found shows error

- **WHEN** no platform-specific package is installed
- **THEN** wrapper script SHALL display error message
- **AND** exit with non-zero code

### Requirement: GitHub Actions workflow for npm publish

The GitHub Actions workflow SHALL build and publish all npm packages when a tag matching @raven.js/cli@v*.*.\* is pushed.

#### Scenario: Tag triggers npm release

- **WHEN** tag @raven.js/cli@v1.0.0 is pushed
- **THEN** release workflow SHALL start
- **AND** all 6 packages (1 main + 5 platform) SHALL be published to npm

#### Scenario: Version from tag is used

- **WHEN** workflow is triggered by tag @raven.js/cli@v1.0.0-alpha.8
- **THEN** all packages SHALL have version 1.0.0-alpha.8

### Requirement: npm token configured in secrets

The GitHub Actions workflow SHALL use NPM_TOKEN from GitHub Secrets for authentication.

#### Scenario: Workflow uses npm token

- **WHEN** npm publish step runs
- **THEN** it SHALL authenticate using NPM_TOKEN secret
