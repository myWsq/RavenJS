## REMOVED Requirements

### Requirement: AI Commands Installation
**Reason**: Command 与 skill 内容重复，只保留 skill 即可满足 AI 识别与执行需求。
**Migration**: 用户使用 skill 替代；已安装的 `.claude/commands/` 在 `raven update` 时不再更新，可手动删除。

### Requirement: Command Metadata Format
**Reason**: 不再提供 command 资源。
**Migration**: 无；command 格式不再使用。

## MODIFIED Requirements

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
