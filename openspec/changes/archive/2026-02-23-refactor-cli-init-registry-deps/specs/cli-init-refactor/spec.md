# CLI Init Refactor

## ADDED Requirements

### Requirement: raven init installs AI resources and initializes raven root

The system SHALL provide a `raven init` command that (1) installs AI resources to `.claude/` and (2) initializes the raven root directory (creates directory and `raven.yaml`). The command SHALL NOT install the core module.

#### Scenario: raven init in fresh directory creates both

- **WHEN** user runs `raven init` in a directory with no raven installation
- **THEN** `.claude/skills/` is populated with AI resources
- **AND** `<root>/` directory is created
- **AND** `<root>/raven.yaml` is created with version from registry
- **AND** core module is NOT installed

#### Scenario: raven init idempotent when root already exists

- **WHEN** user runs `raven init` AND raven root directory exists AND `raven.yaml` exists
- **THEN** raven root directory and `raven.yaml` are NOT modified
- **AND** only AI resources are updated (downloaded/copied)
- **AND** success message indicates AI resources updated

#### Scenario: raven init creates root when only .claude exists

- **WHEN** user runs `raven init` AND `.claude/` exists but raven root does NOT exist
- **THEN** raven root directory is created
- **AND** `raven.yaml` is created
- **AND** AI resources are updated

#### Scenario: raven init shows progress

- **WHEN** user runs `raven init` without `--verbose`
- **THEN** a spinner is displayed during installation
- **AND** completion message shows created or modified files

#### Scenario: raven init supports --source and --verbose

- **WHEN** user runs `raven init --source <path>`
- **THEN** AI resources are loaded from local path instead of GitHub

- **WHEN** user runs `raven init --verbose`
- **THEN** detailed progress is logged to console
- **AND** no spinner is displayed
