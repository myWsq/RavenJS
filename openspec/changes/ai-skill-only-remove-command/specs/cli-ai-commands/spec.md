## MODIFIED Requirements

### Requirement: raven init Command
The system SHALL provide a `raven init` command that installs AI skills only.

#### Scenario: raven init installs AI resources
- **WHEN** user runs `raven init`
- **THEN** AI skills are copied to `.claude/skills/`
- **AND** success message is displayed
- **AND** NO files are copied to `.claude/commands/`

#### Scenario: raven init shows progress
- **WHEN** user runs `raven init` without `--verbose`
- **THEN** a spinner is displayed during installation
- **AND** completion message shows created files

#### Scenario: raven init verbose output
- **WHEN** user runs `raven init --verbose`
- **THEN** detailed progress is logged to console
- **AND** no spinner is displayed

#### Scenario: raven init skips if already initialized
- **WHEN** user runs `raven init` and `.claude/` already exists with content
- **THEN** user is warned that AI resources are already installed
- **AND** user is asked to confirm before overwriting

#### Scenario: raven init creates directory structure
- **WHEN** `raven init` runs
- **THEN** `.claude/skills/` directory is created if missing
- **AND** `.claude/commands/` directory is NOT created (commands are deprecated)

### Requirement: AI skills and commands use raven status for installation check
The system SHALL document that AI skills (in packages/ai) use `raven status` to determine whether RavenJS is installed, instead of hardcoding directory checks.

#### Scenario: install skill references raven status
- **WHEN** agent reads install skill (packages/ai/install/skill.md)
- **THEN** skill instructs agent to run `raven status` to check installation before install
- **AND** skill does NOT hardcode "check raven/ exists" or similar logic

#### Scenario: add skill references raven status
- **WHEN** agent reads add skill (packages/ai/add/skill.md)
- **THEN** skill instructs agent to run `raven status` to verify RavenJS is installed before adding modules
- **AND** skill does NOT hardcode "raven/ exists" check
