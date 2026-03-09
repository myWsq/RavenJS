## ADDED Requirements

### Requirement: install-raven distributes core-only workflow skills

install-raven SHALL 分发与单一 core 工作流一致的默认技能集合。该集合 SHALL 包含 `raven-setup`、`raven-learn`、`raven-use` 和 `raven-update`，并 SHALL NOT 包含 `raven-add`。

#### Scenario: Default install includes core-only skills

- **WHEN** 用户在项目目录运行 `install-raven`
- **THEN** 安装结果 SHALL 包含 `raven-setup/SKILL.md`、`raven-learn/SKILL.md`、`raven-use/SKILL.md` 和 `raven-update/SKILL.md`
- **AND** 安装结果 SHALL NOT 包含 `raven-add/SKILL.md`

## MODIFIED Requirements

### Requirement: raven-setup installs @raven.js/cli in project

The raven-setup skill SHALL instruct the Agent to install `@raven.js/cli` in the current project (e.g. via `bun add -d @raven.js/cli`) when the CLI is not yet available, and then proceed with `raven init` and configuration checks for the single Raven core tree. This behavior SHALL be documented in the raven-setup skill content so that after a user runs install-raven and invokes raven-setup in the Agent, the full setup completes without the user having to run the CLI manually first. The skill SHALL NOT require a follow-up `raven add core` step.

#### Scenario: raven-setup skill mentions installing CLI in project

- **WHEN** the raven-setup skill is read (e.g. `.claude/skills/raven-setup/SKILL.md`)
- **THEN** it SHALL include instructions that when `bunx raven` is not found, the Agent SHALL add `@raven.js/cli` to the project
- **AND** 随后 SHALL 运行 `raven init` 完成 core 安装与初始化检查
- **AND** the skill SHALL NOT require the user to run `raven add core`
