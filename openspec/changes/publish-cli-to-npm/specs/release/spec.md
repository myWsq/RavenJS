## MODIFIED Requirements

### Requirement: Release tag triggers workflow

GitHub Actions SHALL run release workflow when a tag matching @raven.js/cli@v&lt;x.x.x&gt; is pushed.

#### Scenario: Tag push triggers release
- **WHEN** a tag @raven.js/cli@v1.2.3 is pushed to repository
- **THEN** release workflow starts

#### Scenario: Non-version tag does not trigger release
- **WHEN** a tag not matching @raven.js/cli@v&lt;x.x.x&gt; is pushed
- **THEN** release workflow does not start

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

## REMOVED Requirements

### Requirement: GitHub Release creation

**Reason**: Replaced by npm publish as the primary distribution channel
**Migration**: Users should install via `npm install -g @raven.js/cli` instead of using GitHub Releases

### Requirement: Shell script for Unix-like systems

**Reason**: Replaced by npm installation
**Migration**: Use `npm install -g @raven.js/cli` instead of install.sh

### Requirement: PowerShell script for Windows

**Reason**: Replaced by npm installation
**Migration**: Use `npm install -g @raven.js/cli` instead of install.ps1

### Requirement: OS and architecture detection

**Reason**: npm handles platform selection automatically via optionalDependencies
**Migration**: No action needed - npm will install the correct package

### Requirement: Download latest version by default

**Reason**: Replaced by npm version management
**Migration**: Use `npm update -g @raven.js/cli` to update to latest version

### Requirement: Support specific version installation

**Reason**: Replaced by npm version management
**Migration**: Use `npm install -g @raven.js/cli@&lt;version&gt;` to install specific version

### Requirement: Install to standard location

**Reason**: npm handles installation location
**Migration**: npm installs to its standard global bin directory

### Requirement: Binary executable permission

**Reason**: npm handles this automatically
**Migration**: No action needed

### Requirement: Error handling

**Reason**: Replaced by npm's error handling
**Migration**: npm provides its own error messages

### Requirement: Clean up partial downloads

**Reason**: Replaced by npm's installation mechanism
**Migration**: npm handles cleanup automatically
