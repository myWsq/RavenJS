## ADDED Requirements

### Requirement: AI Package Structure
The system SHALL provide a dedicated `packages/ai` package containing AI skills and commands as static resources.

#### Scenario: Package exists under packages
- **WHEN** the monorepo is inspected
- **THEN** `packages/ai/` directory exists
- **AND** it contains a valid `package.json` with `name` and `files` fields

#### Scenario: Skills directory
- **WHEN** the ai package is inspected
- **THEN** `packages/ai/skills/` contains one directory per skill
- **AND** each skill directory contains a `SKILL.md` file

#### Scenario: Commands directory
- **WHEN** the ai package is inspected
- **THEN** `packages/ai/commands/` contains command subdirectories (e.g. `raven/`)
- **AND** each command is a `.md` file

#### Scenario: Package included in workspace
- **WHEN** root `package.json` workspaces are loaded
- **THEN** `packages/ai` is included in the workspace packages
- **AND** the package can be resolved by the monorepo toolchain
