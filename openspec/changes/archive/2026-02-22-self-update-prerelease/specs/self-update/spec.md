## MODIFIED Requirements

### Requirement: CLI Self-Update

The system SHALL allow users to update the CLI itself to the latest version by downloading the prebuilt binary from GitHub Releases and installing it to `~/.local/bin/raven`. The system SHALL support a `--prerelease` flag: without it, only stable versions (tags without prerelease suffix) SHALL be considered; with it, all versions including prereleases SHALL be considered. Version comparison SHALL use semantic versioning semantics (e.g., `0.0.1` is newer than `0.0.1-alpha.1`); the system SHALL NOT perform a downgrade.

#### Scenario: Check for updates

- **WHEN** user runs `raven self-update`
- **THEN** system fetches the latest stable version from GitHub Releases API
- **AND** system compares it with the current CLI version using semver

#### Scenario: Update available

- **WHEN** user runs `raven self-update` and a newer version is available
- **THEN** system downloads the prebuilt binary for the detected OS and architecture from GitHub Releases
- **AND** system installs the binary to `~/.local/bin/raven` and makes it executable
- **AND** system displays a success message with the installed path

#### Scenario: Already up to date

- **WHEN** user runs `raven self-update` and the current CLI version equals or exceeds the latest release (by semver)
- **THEN** system displays "Already up to date" message

#### Scenario: Prerelease update

- **WHEN** user runs `raven self-update --prerelease` and a newer version exists (stable or prerelease)
- **THEN** system fetches the latest version including prereleases from GitHub Releases
- **AND** system compares using semver and updates if the fetched version is greater than the current version

#### Scenario: No downgrade

- **WHEN** user runs `raven self-update` and the current version is a prerelease (e.g., `1.0.0-alpha.2`) while the latest stable is older (e.g., `0.0.1`)
- **THEN** system SHALL display "Already up to date" and SHALL NOT downgrade

#### Scenario: Unsupported platform

- **WHEN** user runs `raven self-update` on an unsupported OS or architecture (e.g. Windows, non-x64/arm64)
- **THEN** system exits with an error indicating the platform is not supported

#### Scenario: Download or install failure

- **WHEN** the download fails or the downloaded file is empty
- **THEN** system exits with an error message suggesting the user check if the release supports their platform
