# Registry AI Agent Schema

**Purpose**: Define the registry structure for AI resources, organized by agent (Claude, Cursor, etc.).

## Requirements

### Requirement: Registry AI Agent-Based Structure
The registry SHALL structure the top-level `ai` property by agent, with each agent containing a source-to-destination mapping (no separate `files` array).

#### Scenario: Registry ai structure by agent
- **WHEN** `registry.json` is loaded
- **THEN** the `ai` object contains agent keys (e.g. `claude`, `cursor`)
- **AND** each agent key maps to `Record<sourcePath, destPath>` where sourcePath is relative to `packages/ai/` and destPath is relative to project root

#### Scenario: Claude agent mapping
- **WHEN** registry `ai.claude` is inspected
- **THEN** it is a plain object with source paths as keys
- **AND** values are install destination paths (e.g. `.claude/skills/...`, `.claude/commands/...`)
- **AND** the list of source files is derived from `Object.keys(ai.claude)` (no separate `files` array)

#### Scenario: No redundant files array
- **WHEN** registry `ai` is inspected
- **THEN** it SHALL NOT contain a top-level `files` array
- **AND** it SHALL NOT contain a top-level `fileMapping` object
- **AND** file lists are derived from each agent's mapping keys
