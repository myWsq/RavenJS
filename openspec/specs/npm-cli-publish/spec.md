# npm-cli-publish Specification

## Purpose

定义通过 npm 发布 @raven.js/cli 的规范。CLI 以单一 Bun-runnable 包形式发布，无需平台特定子包或包装脚本。

## Requirements

### Requirement: Main package includes metadata and README

The main @raven.js/cli package SHALL include keywords, repository fields, README.md (if present), and engines declaring Bun.

#### Scenario: Main package has metadata

- **WHEN** @raven.js/cli is published
- **THEN** package.json SHALL have keywords and repository fields
- **AND** package.json SHALL have "engines": { "bun": ">=1.0" }
- **AND** README.md SHALL be present when included in files array

#### Scenario: Bin points to built bundle

- **WHEN** @raven.js/cli is published
- **THEN** bin field SHALL point to the built JS file (e.g., "./dist/raven.js")
- **AND** the built file SHALL be included in the published package

### Requirement: Single package published to npm

The system SHALL publish exactly one npm package @raven.js/cli when the release workflow runs.

#### Scenario: Single package published

- **WHEN** release workflow runs
- **THEN** exactly one package @raven.js/cli SHALL be published to npm
- **AND** no platform-specific sub-packages SHALL be published

### Requirement: GitHub Actions workflow for npm publish

The GitHub Actions workflow SHALL build and publish the single @raven.js/cli package when a tag matching the release pattern (v\*) is pushed.

#### Scenario: Tag triggers npm release

- **WHEN** tag v1.0.0 is pushed
- **THEN** release workflow SHALL start
- **AND** exactly one package @raven.js/cli SHALL be published to npm

#### Scenario: Version from tag is used

- **WHEN** workflow is triggered by tag v1.0.0-alpha.8
- **THEN** @raven.js/cli SHALL have version 1.0.0-alpha.8

### Requirement: npm token configured in secrets

The GitHub Actions workflow SHALL use NPM_TOKEN from GitHub Secrets for authentication.

#### Scenario: Workflow uses npm token

- **WHEN** npm publish step runs
- **THEN** it SHALL authenticate using NPM_TOKEN secret (via NODE_AUTH_TOKEN)
