# AI First Integration

**Purpose**: TBD

## Requirements

### Requirement: AI Skills Installation
The system SHALL support installing AI skills to the `.claude/skills/` directory.

#### Scenario: Install AI skills via raven init
- **WHEN** user runs `raven init`
- **THEN** AI skills are copied to `.claude/skills/` directory
- **AND** skills are immediately recognizable by Claude

#### Scenario: Skills directory structure
- **WHEN** `raven init` completes
- **THEN** `.claude/skills/` contains one directory per skill
- **AND** each skill directory contains a `SKILL.md` file

### Requirement: AI Resource Registry
The system SHALL maintain a registry of available AI resources (skills only) under a top-level `ai` property, structured by agent.

#### Scenario: Registry includes AI resources
- **WHEN** `registry.json` is loaded
- **THEN** AI skills are listed under `ai.claude` (or other agent keys)
- **AND** each agent's value is a mapping `Record<sourcePath, destPath>` describing which files to install and their destinations
- **AND** source paths are relative to `packages/ai/`, destination paths relative to project root

#### Scenario: AI resources sourced from packages/ai
- **WHEN** CLI downloads or copies AI resources for installation
- **THEN** sources are resolved from `packages/ai/` (remote: `packages/ai/` in release; local: workspace `packages/ai/`)
- **AND** the registry `ai.claude` mapping describes which files to install and their destinations
- **AND** the CLI uses `ai.claude` by default (Claude agent)
- **AND** only skill files (SKILL.md) are installed; no command files

### Requirement: Skill Metadata Format
The system SHALL provide skills in Claude-compatible SKILL.md format.

#### Scenario: Skill has required frontmatter
- **WHEN** a skill is installed
- **THEN** its SKILL.md includes frontmatter with `name`, `description`, `license`
- **AND** optional `compatibility` and `metadata` fields

#### Scenario: Skill has usage instructions
- **WHEN** a skill is installed
- **THEN** its SKILL.md includes "何时使用" and "不使用时" sections
- **AND** provides clear guidance for AI on when to invoke the skill
