## REMOVED Requirements

### Requirement: Commands directory
**Reason**: 只保留 skill，不再提供 command。
**Migration**: 无；不再有 commands 目录。

#### Scenario: Commands directory
- **WHEN** the ai package is inspected
- **THEN** `packages/ai/commands/` contains command subdirectories (e.g. `raven/`)
- **AND** each command is a `.md` file

## MODIFIED Requirements

### Requirement: AI Package Structure
The system SHALL provide a dedicated `packages/ai` package containing AI skills as static resources.

#### Scenario: Package exists under packages
- **WHEN** the monorepo is inspected
- **THEN** `packages/ai/` directory exists
- **AND** it contains a valid `package.json` with `name` and `claude` (or equivalent agent mapping) fields

#### Scenario: Skills structure
- **WHEN** the ai package is inspected
- **THEN** `packages/ai/` contains one directory per capability (e.g. `install/`, `add/`)
- **AND** each capability directory contains a `skill.md` file (SKILL.md format)
- **AND** it SHALL NOT contain `command.md` files

#### Scenario: Package included in workspace
- **WHEN** root `package.json` workspaces are loaded
- **THEN** `packages/ai` is included in the workspace packages
- **AND** the package can be resolved by the monorepo toolchain
