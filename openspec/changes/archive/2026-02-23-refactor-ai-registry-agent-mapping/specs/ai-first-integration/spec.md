## MODIFIED Requirements

### Requirement: AI Resource Registry
The system SHALL maintain a registry of available AI resources (skills and commands) under a top-level `ai` property, structured by agent.

#### Scenario: Registry includes AI resources
- **WHEN** `registry.json` is loaded
- **THEN** AI skills and commands are listed under `ai.claude` (or other agent keys)
- **AND** each agent's value is a mapping `Record<sourcePath, destPath>` describing which files to install and their destinations
- **AND** source paths are relative to `packages/ai/`, destination paths relative to project root

#### Scenario: AI resources sourced from packages/ai
- **WHEN** CLI downloads or copies AI resources for installation
- **THEN** sources are resolved from `packages/ai/` (remote: `packages/ai/` in release; local: workspace `packages/ai/`)
- **AND** the registry `ai.claude` mapping describes which files to install and their destinations
- **AND** the CLI uses `ai.claude` by default (Claude agent)
