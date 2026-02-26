# cli-bun-publish Specification (Delta)

## Purpose

定义使用 Bun 将 CLI 打包为 target=bun 的 JS 产物并直接发布到 npm 的规范。

## ADDED Requirements

### Requirement: CLI built as Bun-targeted bundle

The system SHALL build @raven.js/cli using `bun build` with output as a single JS file runnable by Bun, without compiling standalone binaries.

#### Scenario: Build produces JS bundle

- **WHEN** build runs for @raven.js/cli
- **THEN** output SHALL be a single JS file (e.g., dist/raven.js)
- **AND** the file SHALL include shebang `#!/usr/bin/env bun`
- **AND** the file SHALL NOT be a native binary

#### Scenario: Build uses minification

- **WHEN** build runs
- **THEN** `bun build` SHALL use `--minify` for smaller output

### Requirement: Single package published to npm

The system SHALL publish exactly one npm package @raven.js/cli, with no platform-specific sub-packages.

#### Scenario: Single package published

- **WHEN** release workflow runs
- **THEN** exactly one package @raven.js/cli SHALL be published to npm
- **AND** no @raven.js/cli-linux-x64, @raven.js/cli-darwin-arm64, or similar packages SHALL be published

#### Scenario: Package includes bundle and registry

- **WHEN** @raven.js/cli is published
- **THEN** package SHALL include the built JS bundle
- **AND** package SHALL include registry.json if required by CLI
- **AND** bin field SHALL point to the built bundle

### Requirement: Package declares Bun as runtime

The @raven.js/cli package SHALL declare Bun as the required runtime via engines field.

#### Scenario: engines field specifies Bun

- **WHEN** @raven.js/cli is published
- **THEN** package.json SHALL have "engines": { "bun": ">=1.0" }
- **AND** bin entry SHALL be executable via `bun` when invoked
