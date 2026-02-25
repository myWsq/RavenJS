# install-raven Specification

## Purpose

定义 install-raven CLI 的职责：仅将 RavenJS AI skills 安装到项目的 skill 目录，不安装 @raven.js/cli、不创建 raven 根目录、不执行 raven init/add。

## Requirements

### Requirement: install-raven CLI installs only AI Skills

The system SHALL provide a dedicated CLI named install-raven whose sole responsibility is to copy RavenJS AI skills into the project's skill directory (e.g. `.claude/skills/`). The CLI SHALL NOT install @raven.js/cli, SHALL NOT create the raven root directory, and SHALL NOT run raven init or raven add.

#### Scenario: Default run installs skills to .claude/skills

- **WHEN** the user runs `install-raven` (or `npx install-raven`) in a project directory
- **THEN** the CLI copies all configured AI skill files into `.claude/skills/` (one subdirectory per skill, each containing `SKILL.md`)
- **AND** no `raven/` directory or `raven.yaml` is created
- **AND** @raven.js/cli is not added to the project

#### Scenario: Idempotent re-run

- **WHEN** the user runs `install-raven` and `.claude/skills/` already contains RavenJS skills
- **THEN** the CLI overwrites or updates existing skill files so that content matches the source
- **AND** exit code is 0 and a success message is shown

#### Scenario: Skill source matches packages/ai mapping

- **WHEN** install-raven resolves skill sources (local or published)
- **THEN** it SHALL use the same source-to-destination mapping as defined for Claude (e.g. from `packages/ai/package.json` `claude` field or equivalent registry ai structure)
- **AND** destination paths SHALL be relative to the project root (e.g. `.claude/skills/raven-setup/SKILL.md`)

### Requirement: install-raven supports configurable target directory

The system SHALL allow the target skill root directory to be overridden (e.g. via `--target` or an environment variable) so that skills are written to a directory other than `.claude/skills/`.

#### Scenario: Override target with option

- **WHEN** the user runs `install-raven --target .cursor/skills`
- **THEN** skill files are written under `.cursor/skills/` with the same subdirectory and file names (e.g. `raven-setup/SKILL.md`)
- **AND** no files are written under `.claude/skills/`

#### Scenario: Help documents target option

- **WHEN** the user runs `install-raven --help`
- **THEN** the output describes the default target and how to override it (e.g. `--target <dir>`)

### Requirement: raven-setup installs @raven.js/cli in project

The raven-setup skill SHALL instruct the Agent to install `@raven.js/cli` in the current project (e.g. via `bun add -d @raven.js/cli`) when the CLI is not yet available, and then proceed with `raven init`, adding core, and configuration checks. This behavior SHALL be documented in the raven-setup skill content so that after a user runs install-raven and invokes raven-setup in the Agent, the full setup completes without the user having to run the CLI manually first.

#### Scenario: raven-setup skill mentions installing CLI in project

- **WHEN** the raven-setup skill is read (e.g. `.claude/skills/raven-setup/SKILL.md`)
- **THEN** it SHALL include instructions that when `bunx raven` (or equivalent) is not found, the Agent SHALL add `@raven.js/cli` to the project (e.g. `bun add -d @raven.js/cli`) and then continue with init and core setup
- **AND** the skill SHALL NOT require the user to have run `raven init` or installed @raven.js/cli before invoking raven-setup
