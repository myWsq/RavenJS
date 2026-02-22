## ADDED Requirements

### Requirement: raven status Command
The system SHALL provide a `raven status` command that reports installation status of core and modules in the current project (raven root directory only, no AI directory checks).

#### Scenario: raven status shows core installed
- **WHEN** user runs `raven status` AND `<root>/core/` exists with content
- **THEN** output indicates core is installed

#### Scenario: raven status shows core not installed
- **WHEN** user runs `raven status` AND `<root>/` does not exist or `<root>/core/` is missing/empty
- **THEN** output indicates core is not installed

#### Scenario: raven status lists installed modules
- **WHEN** user runs `raven status` AND `<root>/` contains subdirectories matching registry modules (e.g., jtd-validator)
- **THEN** output lists those modules as installed

#### Scenario: raven status supports --json
- **WHEN** user runs `raven status --json`
- **THEN** output is valid JSON with keys core, modules
- **AND** each key has installation status suitable for programmatic consumption

#### Scenario: raven status respects --root
- **WHEN** user runs `raven status --root <dir>` or RAVEN_ROOT is set
- **THEN** status is checked relative to `<cwd>/<dir>/`

#### Scenario: raven status exits 0 when nothing installed
- **WHEN** user runs `raven status` in a project with no RavenJS installation
- **THEN** exit code is 0
- **AND** output indicates nothing is installed
