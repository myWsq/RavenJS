## ADDED Requirements

### Requirement: CLI Self-Update

The system SHALL allow users to update the CLI itself to the latest version.

#### Scenario: Check for updates

- **WHEN** user runs `raven self-update`
- **THEN** system checks for new version from package manager

#### Scenario: Update available

- **WHEN** user runs `raven self-update` and new version is available
- **THEN** system prompts user to confirm update
- **AND** system installs new version via package manager

#### Scenario: Already up to date

- **WHEN** user runs `raven self-update` and CLI is already latest
- **THEN** system displays "Already up to date" message
