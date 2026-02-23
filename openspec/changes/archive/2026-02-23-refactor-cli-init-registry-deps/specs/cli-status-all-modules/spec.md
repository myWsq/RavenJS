# CLI Status All Modules

## ADDED Requirements

### Requirement: raven status lists all registry modules with installed flag

The system SHALL provide a `raven status` command that lists every module defined in the registry, with each entry indicating whether that module is installed. Core SHALL be treated as a regular module (no separate top-level core field).

#### Scenario: raven status shows all modules from registry

- **WHEN** user runs `raven status`
- **THEN** output includes every module in registry.modules
- **AND** each module has an `installed` boolean indicating installation status
- **AND** modules are ordered consistently (e.g., alphabetically by name)

#### Scenario: raven status installed true when module dir exists with content

- **WHEN** user runs `raven status` AND `<root>/<module>/` exists with at least one file
- **THEN** that module's `installed` is true

#### Scenario: raven status installed false when module not present

- **WHEN** user runs `raven status` AND a registry module has no corresponding directory under `<root>/`
- **THEN** that module's `installed` is false

#### Scenario: raven status --json output structure

- **WHEN** user runs `raven status --json`
- **THEN** output is valid JSON
- **AND** includes a `modules` array (or equivalent) with `{ name: string; installed: boolean }` per module
- **AND** does NOT include a top-level `core` object separate from modules

#### Scenario: raven status when nothing installed

- **WHEN** user runs `raven status` in a project with no raven root
- **THEN** exit code is 0
- **AND** all modules show `installed: false`
- **AND** version may be absent or derived from registry
