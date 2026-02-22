## ADDED Requirements

### Requirement: Registry AI Top-Level Property
The registry SHALL include a top-level `ai` property, sibling to `modules`, describing AI resources (skills and commands).

#### Scenario: Registry has ai property
- **WHEN** `registry.json` is loaded
- **THEN** the registry object has an `ai` property at the top level
- **AND** `ai` is not nested under `modules`

#### Scenario: AI property structure
- **WHEN** registry `ai` is inspected
- **THEN** it contains `files`: an array of relative file paths (skills and commands)
- **AND** it MAY contain `fileMapping`: Record mapping each file to its install destination path (e.g. `.claude/skills/...`)

#### Scenario: Modules exclude AI resources
- **WHEN** registry `modules` is inspected
- **THEN** it SHALL NOT contain an `ai-skills` or equivalent AI-only module entry
- **AND** AI resources are exclusively described under `ai`
