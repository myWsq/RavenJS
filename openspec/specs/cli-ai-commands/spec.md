# CLI AI Commands

**Purpose**: TBD

## Requirements

### Requirement: raven init Command
The system SHALL provide a `raven init` command that installs AI skills and commands.

#### Scenario: raven init installs AI resources
- **WHEN** user runs `raven init`
- **THEN** AI skills are copied to `.claude/skills/`
- **AND** AI commands are copied to `.claude/commands/`
- **AND** success message is displayed

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
- **AND** `.claude/commands/` directory is created if missing

### Requirement: raven init Command Options
The system SHALL support standard CLI options for `raven init`.

#### Scenario: raven init supports --source
- **WHEN** user runs `raven init --source <path>`
- **THEN** AI resources are loaded from local path instead of GitHub

#### Scenario: raven init supports --verbose
- **WHEN** user runs `raven init --verbose` or `-v`
- **THEN** verbose output is enabled

### Requirement: raven init Help Text
The system SHALL provide help text for `raven init` command.

#### Scenario: raven init --help shows usage
- **WHEN** user runs `raven init --help`
- **THEN** command description is displayed
- **AND** available options are listed

### Requirement: AI skills and commands use raven status for installation check
The system SHALL document that AI skills and commands (in packages/ai) use `raven status` to determine whether RavenJS is installed, instead of hardcoding directory checks.

#### Scenario: install skill references raven status
- **WHEN** agent reads install skill (packages/ai/install/skill.md)
- **THEN** skill instructs agent to run `raven status` to check installation before install/init
- **AND** skill does NOT hardcode "check raven/ exists" or similar logic

#### Scenario: install command references raven status
- **WHEN** agent reads install command (packages/ai/install/command.md)
- **THEN** command instructs agent to run `raven status` in the "检查项目状态" step
- **AND** command does NOT hardcode directory existence checks

#### Scenario: add skill references raven status
- **WHEN** agent reads add skill (packages/ai/add/skill.md)
- **THEN** skill instructs agent to run `raven status` to verify RavenJS is installed before adding modules
- **AND** skill does NOT hardcode "raven/ exists" check
