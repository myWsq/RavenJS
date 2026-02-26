## MODIFIED Requirements

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
