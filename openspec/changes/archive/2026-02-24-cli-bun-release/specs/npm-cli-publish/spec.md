# npm-cli-publish Specification (Delta)

## MODIFIED Requirements

### Requirement: Main package includes metadata and README

The main @raven.js/cli package SHALL include keywords, repository fields, README.md, and engines declaring Bun.

#### Scenario: Main package has metadata
- **WHEN** @raven.js/cli is published
- **THEN** package.json SHALL have keywords and repository fields
- **AND** README.md file SHALL be present
- **AND** package.json SHALL have "engines": { "bun": ">=1.0" }

#### Scenario: Bin points to built bundle
- **WHEN** @raven.js/cli is published
- **THEN** bin field SHALL point to the built JS file (e.g., "./dist/raven.js")
- **AND** the built file SHALL be included in the published package

### Requirement: GitHub Actions workflow for npm publish

The GitHub Actions workflow SHALL build and publish the single @raven.js/cli package when a tag matching the release pattern is pushed.

#### Scenario: Tag triggers npm release
- **WHEN** tag matching release pattern is pushed (e.g., v1.0.0 or @raven.js/cli@v1.0.0)
- **THEN** release workflow SHALL start
- **AND** exactly one package @raven.js/cli SHALL be published to npm

#### Scenario: Version from tag is used
- **WHEN** workflow is triggered by tag @raven.js/cli@v1.0.0-alpha.8 or v1.0.0-alpha.8
- **THEN** @raven.js/cli SHALL have version 1.0.0-alpha.8

## REMOVED Requirements

### Requirement: Platform-specific npm packages

**Reason**: CLI is published as a single Bun-runnable package, no platform sub-packages.

**Migration**: Users install `@raven.js/cli` and run `raven` (requires Bun).

### Requirement: Platform-specific package structure

**Reason**: No platform-specific packages exist.

**Migration**: N/A.

### Requirement: Main package with optionalDependencies

**Reason**: No platform sub-packages; single package has no optionalDependencies.

**Migration**: N/A.

### Requirement: Main package wrapper script

**Reason**: Bin points directly to the built JS bundle, no wrapper needed.

**Migration**: N/A.
