# CLI Tool Specification

> **Migration Note**: This spec consolidates following original specs:
> - `cli-tool`
> - `registry-based-install`
> - `cli-ai-commands`
> - `cli-output-styling`
> - `cli-status-command`
> - `self-update`
> - `ai-first-integration`
> - `ai-package`
> - `registry-ai-agent-schema`

## Purpose

定义 RavenJS CLI 工具的所有功能，包括安装、更新、状态查询、AI 资源管理、自更新等。

## Requirements

### Requirement: Raven CLI 工具可以全局安装

RavenJS SHALL 提供一个可通过 npm 全局安装的 CLI 工具，用户安装后可在任意目录使用 `raven` 命令。

#### Scenario: 全局安装 CLI

- **WHEN** 用户执行 `npm install -g @ravenjs/cli`
- **THEN** `raven` 命令可在终端全局使用

### Requirement: install 命令安装项目

`raven install` SHALL 将 RavenJS core 代码复制到用户当前目录，并创建必要的项目结构。

#### Scenario: 执行 install 命令

- **WHEN** 用户在空目录执行 `raven install`
- **THEN** 创建 `src/raven/` 目录，包含 core 代码副本
- **AND** 创建 `.trae/skills/ravenjs/SKILL.md`
- **AND** 创建 `app.ts` 作为用户代码入口

#### Scenario: 目录非空时拒绝安装

- **WHEN** 用户在非空目录执行 `raven install`
- **THEN** CLI 显示错误信息，提示用户选择空目录或指定子目录

### Requirement: add 命令添加功能模块

`raven add <feature>` SHALL 将指定的功能模块代码复制到用户项目。

#### Scenario: 添加 jtd-validator

- **WHEN** 用户执行 `raven add jtd-validator`
- **THEN** 将 jtd-validator 包代码复制到 `src/raven/jtd-validator/`

#### Scenario: 添加不存在的功能

- **WHEN** 用户执行 `raven add <不存在的功能>`
- **THEN** CLI 显示可用功能列表

### Requirement: raven update Command

The system SHALL update installed RavenJS modules AND AI resources when `raven update` is executed.

#### Scenario: raven update updates framework modules

- **WHEN** user runs `raven update`
- **THEN** all installed modules in `raven/` are updated
- **AND** `raven.yaml` is updated with latest version

#### Scenario: raven update updates AI resources

- **WHEN** user runs `raven update` AND `.claude/` exists with AI resources
- **THEN** AI skills in `.claude/skills/` are updated
- **AND** success message includes both framework and AI resources
- **AND** NO files are written to `.claude/commands/` (commands are deprecated)

#### Scenario: raven update when AI resources not installed

- **WHEN** user runs `raven update` AND `.claude/` does NOT exist
- **THEN** only framework modules are updated
- **AND** no error is raised about missing AI resources

#### Scenario: raven update shows combined progress

- **WHEN** user runs `raven update`
- **THEN** progress indicator shows both framework and AI resource updates
- **AND** final summary lists all modified files

### Requirement: raven init Command

The system SHALL provide a `raven init` command that installs AI skills only.

#### Scenario: raven init installs AI resources

- **WHEN** user runs `raven init`
- **THEN** AI skills are copied to `.claude/skills/`
- **AND** success message is displayed
- **AND** NO files are copied to `.claude/commands/`

#### Scenario: raven init shows progress

- **WHEN** user runs `raven init` without `--verbose`
- **THEN** a spinner is displayed during installation
- **AND** completion message shows created files

#### Scenario: raven init verbose output

- **WHEN** user runs `raven init --verbose`
- **THEN** detailed progress is logged to console
- **AND** no spinner is displayed

#### Scenario: raven init skips if already initialized

- **WHEN** user runs `raven init` and `.claude/` already exists with content
- **THEN** user is warned that AI resources are already installed
- **AND** user is asked to confirm before overwriting

#### Scenario: raven init creates directory structure

- **WHEN** `raven init` runs
- **THEN** `.claude/skills/` directory is created if missing
- **AND** `.claude/commands/` directory is NOT created (commands are deprecated)

### Requirement: raven init Command Options

The system SHALL support standard CLI options for `raven init`.

#### Scenario: raven init supports --source

- **WHEN** user runs `raven init --source <path>`
- **THEN** AI resources are loaded from local path instead of GitHub

#### Scenario: raven init supports --verbose

- **WHEN** user runs `raven init --verbose` or `-v`
- **THEN** verbose output is enabled

### Requirement: raven init Help Text

The system SHALL provide help text for `raven init` command.

#### Scenario: raven init --help shows usage

- **WHEN** user runs `raven init --help`
- **THEN** command description is displayed
- **AND** available options are listed

### Requirement: AI skills use raven status for installation check

The system SHALL document that AI skills (in packages/ai) use `raven status` to determine whether RavenJS is installed, instead of hardcoding directory checks.

#### Scenario: install skill references raven status

- **WHEN** agent reads install skill (packages/ai/install/skill.md)
- **THEN** skill instructs agent to run `raven status` to check installation before install
- **AND** skill does NOT hardcode "check raven/ exists" or similar logic

#### Scenario: add skill references raven status

- **WHEN** agent reads add skill (packages/ai/add/skill.md)
- **THEN** skill instructs agent to run `raven status` to verify RavenJS is installed before adding modules
- **AND** skill does NOT hardcode "raven/ exists" check

### Requirement: AI Skills Installation

The system SHALL support installing AI skills to `.claude/skills/` directory.

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

### Requirement: Registry AI Agent-Based Structure

The registry SHALL structure the top-level `ai` property by agent, with each agent containing a source-to-destination mapping (no separate `files` array).

#### Scenario: Registry ai structure by agent

- **WHEN** `registry.json` is loaded
- **THEN** the `ai` object contains agent keys (e.g. `claude`, `cursor`)
- **AND** each agent key maps to `Record<sourcePath, destPath>` where sourcePath is relative to `packages/ai/` and destPath is relative to project root

#### Scenario: Claude agent mapping

- **WHEN** registry `ai.claude` is inspected
- **THEN** it is a plain object with source paths as keys
- **AND** values are install destination paths (e.g. `.claude/skills/raven-install/SKILL.md`, `.claude/skills/raven-add/SKILL.md`)
- **AND** the list of source files is derived from `Object.keys(ai.claude)` (no separate `files` array)
- **AND** mapping SHALL NOT include paths to `.claude/commands/`

#### Scenario: No redundant files array

- **WHEN** registry `ai` is inspected
- **THEN** it SHALL NOT contain a top-level `files` array
- **AND** it SHALL NOT contain a top-level `fileMapping` object
- **AND** file lists are derived from each agent's mapping keys

### Requirement: Colorized output via a standard colors library



The CLI SHALL use a well-known colors library (e.g., picocolors, chalk, kleur) for all colored output instead of raw ANSI escape codes.

#### Scenario: Error messages are red

- **WHEN** CLI prints an error message
- **THEN** the message text is rendered in red

#### Scenario: Success messages are green

- **WHEN** CLI prints a success message (e.g., after install/add/update)
- **THEN** the message is rendered in green

#### Scenario: Info messages are distinct

- **WHEN** CLI prints an info message
- **THEN** the message uses a distinct style (e.g., cyan or dim) for readability

### Requirement: Respect NO_COLOR and non-TTY environments

The CLI SHALL disable colors when `NO_COLOR` is set or when stdout is not a TTY, to avoid ANSI noise in logs and CI.

#### Scenario: NO_COLOR disables colors

- **WHEN** `NO_COLOR` environment variable is set
- **THEN** all output is plain text without ANSI color codes

#### Scenario: Piped/redirected output has no colors

- **WHEN** stdout is not a TTY (e.g., `raven install | cat`)
- **THEN** output is plain text without ANSI codes

### Requirement: Loading spinners for async operations

The CLI SHALL show a loading spinner during long-running operations (install, add, update).

#### Scenario: install shows spinner during download

- **WHEN** user runs `raven install`
- **THEN** a spinner is shown while core files are being downloaded

#### Scenario: add shows spinner during module download

- **WHEN** user runs `raven add <module>`
- **THEN** a spinner is shown while the module is being downloaded

#### Scenario: update shows spinner during update

- **WHEN** user runs `raven update`
- **THEN** a spinner is shown during the update process

### Requirement: Structured output sections

The CLI SHALL output structured sections (e.g., Modified Files, Required Dependencies) with clear headers and consistent formatting.

#### Scenario: Modified files list has a header

- **WHEN** install, add, or update completes successfully
- **THEN** a "Modified Files" section is shown with a clear header

#### Scenario: Dependencies list uses consistent formatting

- **WHEN** a module with dependencies is added or updated
- **THEN** a "Required Dependencies" section lists packages in `package@version` format

### Requirement: raven status Command

The system SHALL provide a `raven status` command that reports installation status of core and modules in current project (raven root directory only, no AI directory checks).

#### Scenario: raven status shows core installed

- **WHEN** user runs `raven status` AND `<root>/core/` exists with content
- **THEN** output indicates core is installed

#### Scenario: raven status shows core not installed

- **WHEN** user runs `raven status` AND `<root>/` does not exist or `<root>/core/` is missing/empty
- **THEN** output indicates core is not installed

#### Scenario: raven status lists installed modules

- **WHEN** user runs `raven status` AND `<root>/` contains subdirectories matching registry modules (e.g., jtd-validator)
- **THEN** output lists those modules as installed

#### Scenario: raven status supports --json

- **WHEN** user runs `raven status --json`
- **THEN** output is valid JSON with keys core, modules
- **AND** each key has installation status suitable for programmatic consumption

#### Scenario: raven status respects --root

- **WHEN** user runs `raven status --root <dir>` or RAVEN_ROOT is set
- **THEN** status is checked relative to `<cwd>/<dir>/`

#### Scenario: raven status exits 0 when nothing installed

- **WHEN** user runs `raven status` in a project with no RavenJS installation
- **THEN** exit code is 0
- **AND** output indicates nothing is installed

### Requirement: CLI Self-Update

The system SHALL allow users to update the CLI itself to the latest version by downloading a prebuilt binary from GitHub Releases and installing it to `~/.local/bin/raven`. The system SHALL support a `--prerelease` flag: without it, only stable versions (tags without prerelease suffix) SHALL be considered; with it, all versions including prereleases SHALL be considered. Version comparison SHALL use semantic versioning semantics (e.g., `0.0.1` is newer than `0.0.1-alpha.1`); the system SHALL NOT perform a downgrade.

#### Scenario: Check for updates

- **WHEN** user runs `raven self-update`
- **THEN** the system fetches the latest stable version from GitHub Releases API
- **AND** the system compares it with the current CLI version using semver

#### Scenario: Update available

- **WHEN** user runs `raven self-update` and a newer version is available
- **THEN** the system downloads a prebuilt binary for the detected OS and architecture from GitHub Releases
- **AND** the system installs the binary to `~/.local/bin/raven` and makes it executable
- **AND** the system displays a success message with the installed path

#### Scenario: Already up to date

- **WHEN** user runs `raven self-update` and the current CLI version equals or exceeds the latest release (by semver)
- **THEN** the system displays "Already up to date" message

#### Scenario: Prerelease update

- **WHEN** user runs `raven self-update --prerelease` and a newer version exists (stable or prerelease)
- **THEN** the system fetches the latest version including prereleases from GitHub Releases
- **AND** the system compares using semver and updates if the fetched version is greater than the current version

#### Scenario: No downgrade

- **WHEN** user runs `raven self-update` and the current version is a prerelease (e.g., `1.0.0-alpha.2`) while the latest stable is older (e.g., `0.0.1`)
- **THEN** the system SHALL display "Already up to date" and SHALL NOT downgrade

#### Scenario: Unsupported platform

- **WHEN** user runs `raven self-update` on an unsupported OS or architecture (e.g. Windows, non-x64/arm64)
- **THEN** the system exits with an error indicating the platform is not supported

#### Scenario: Download or install failure

- **WHEN** the download fails or the downloaded file is empty
- **THEN** the system exits with an error message suggesting the user check if the release supports their platform

### Requirement: Registry-Based Module Installation

The system SHALL provide a mechanism to install RavenJS modules from a registry that describes module files and external dependencies.

#### Scenario: Initialize new project

- **WHEN** user runs `raven install` in an empty directory
- **THEN** the system creates a `raven/` directory with version from registry
- **AND** the system downloads core module files from GitHub based on registry.json

#### Scenario: Add module to existing project

- **WHEN** user runs `raven add <module-name>` with a valid module name
- **THEN** the system downloads module files to `raven/<module-name>/`
- **AND** the system installs external dependencies if any

#### Scenario: Module not found

- **WHEN** user runs `raven add <invalid-module>`
- **THEN** the system displays an error with available modules list

### Requirement: Parallel File Download

The system SHALL download multiple files concurrently when installing modules.

#### Scenario: Download multiple files

- **WHEN** the system needs to download 10 files for a module
- **THEN** the system SHALL download files in parallel (not sequentially)

#### Scenario: Download failure

- **WHEN** any file download fails
- **THEN** the system displays an error with the failed file URL
- **AND** the system does not leave partial files

### Requirement: All CLI outputs in JSON format (Agent-facing)

All RavenJS CLI commands SHALL output JSON format by default, with the exception of `raven init` and `raven guide`.

#### Scenario: CLI command outputs JSON
- **WHEN** an Agent runs any RavenJS CLI command except `raven init` and `raven guide`
- **THEN** the output SHALL be valid JSON

#### Scenario: raven init for human use
- **WHEN** a human runs `raven init`
- **THEN** the output SHALL be human-friendly (non-JSON)

### Requirement: CLI provides structured information for Agent

The CLI SHALL provide structured information to help Agents make decisions, including current version, latest version, file hashes, and modified file status (via `raven status` and `raven diff`).

#### Scenario: Agent checks status
- **WHEN** an Agent runs `raven status`
- **THEN** the output SHALL include current version, latest version (when available), and file hashes

### Requirement: CLI provides guidance entry points

The CLI SHALL provide entry points for Agents to fetch information, without pre-computing change analysis.

#### Scenario: Agent gets guidance
- **WHEN** an Agent runs `raven guide <module>`
- **THEN** the output SHALL provide basic context (README and source code) and action entry points (fetch, diff, etc.)

### Requirement: Configurable Raven Root

The system SHALL allow users to configure the RavenJS root directory.

#### Scenario: Default raven directory

- **WHEN** user runs `raven install` without any options
- **THEN** the system creates `raven/` as the default root directory

#### Scenario: Custom raven directory

- **WHEN** user runs `raven install --raven-root custom-dir`
- **THEN** the system creates `custom-dir/` as the root directory
