## MODIFIED Requirements

### Requirement: raven update Command
The system SHALL update installed RavenJS modules AND AI resources when `raven update` is executed.

#### Scenario: raven update updates framework modules
- **WHEN** user runs `raven update`
- **THEN** all installed modules in `raven/` are updated
- **AND** `raven.yaml` is updated with latest version

#### Scenario: raven update updates AI resources
- **WHEN** user runs `raven update` AND `.claude/` exists with AI resources
- **THEN** AI skills in `.claude/skills/` are updated
- **AND** success message includes both framework and AI resources
- **AND** NO files are written to `.claude/commands/` (commands are deprecated)

#### Scenario: raven update when AI resources not installed
- **WHEN** user runs `raven update` AND `.claude/` does not exist
- **THEN** only framework modules are updated
- **AND** no error is raised about missing AI resources

#### Scenario: raven update shows combined progress
- **WHEN** user runs `raven update`
- **THEN** progress indicator shows both framework and AI resource updates
- **AND** final summary lists all modified files
