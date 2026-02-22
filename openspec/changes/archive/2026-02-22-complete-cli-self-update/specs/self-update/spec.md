## MODIFIED Requirements

### Requirement: CLI Self-Update
The system SHALL allow users to update the CLI itself to the latest version by downloading the prebuilt binary from GitHub Releases and installing it to `~/.local/bin/raven`.

#### Scenario: Check for updates
- **WHEN** user runs `raven self-update`
- **THEN** system fetches the latest version from GitHub Releases API
- **AND** system compares it with the current CLI version

#### Scenario: Update available
- **WHEN** user runs `raven self-update` and a new version is available
- **THEN** system downloads the prebuilt binary for the detected OS and architecture from GitHub Releases
- **AND** system installs the binary to `~/.local/bin/raven` and makes it executable
- **AND** system displays a success message with the installed path

#### Scenario: Already up to date
- **WHEN** user runs `raven self-update` and CLI version equals the latest release
- **THEN** system displays "Already up to date" message

#### Scenario: Unsupported platform
- **WHEN** user runs `raven self-update` on an unsupported OS or architecture (e.g. Windows, non-x64/arm64)
- **THEN** system exits with an error indicating the platform is not supported

#### Scenario: Download or install failure
- **WHEN** the download fails or the downloaded file is empty
- **THEN** system exits with an error message suggesting the user check if the release supports their platform
