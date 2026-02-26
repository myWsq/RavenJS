## MODIFIED Requirements

### Requirement: AI Resource Registry

The system SHALL maintain a registry of available AI resources (skills and commands) under a top-level `ai` property.

#### Scenario: Registry includes AI resources

- **WHEN** `registry.json` is loaded
- **THEN** AI skills and commands are listed under the top-level `ai` property (not under `modules`)
- **AND** each resource has its file path specified via `ai.files` and optional `ai.fileMapping` for install destinations

#### Scenario: AI resources sourced from packages/ai

- **WHEN** CLI downloads or copies AI resources for installation
- **THEN** sources are resolved from `packages/ai/` (remote: `packages/ai/` in release; local: workspace `packages/ai/`)
- **AND** the registry `ai` field describes which files to install and their destinations
