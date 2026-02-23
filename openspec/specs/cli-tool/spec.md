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

### Requirement: add 命令添加功能模块

`raven add <module>` SHALL copy the specified module's code to the project. Before installing the target module, the system SHALL install any uninstalled dependencies listed in the registry's dependsOn for that module. Dependencies SHALL be installed in topological order. When copying module files, the system SHALL replace `@ravenjs/<module>` import paths with the correct relative path (e.g., `../core`) before writing.

#### Scenario: 添加 jtd-validator

- **WHEN** user runs `raven add jtd-validator`
- **THEN** if core (a dependency) is not installed, core is installed first
- **AND** jtd-validator module code is copied to `<root>/jtd-validator/`

#### Scenario: 添加 core 模块

- **WHEN** user runs `raven add core`
- **THEN** core module is installed to `<root>/core/`
- **AND** skill can use this command to install RavenJS core

#### Scenario: add 自动安装依赖

- **WHEN** user runs `raven add jtd-validator` AND core is NOT installed
- **THEN** core is installed first, then jtd-validator

#### Scenario: add 替换 @ravenjs/* 为相对路径

- **WHEN** CLI copies jtd-validator files and main.ts contains `from "@ravenjs/core"`
- **THEN** the written file contains `from "../core"` (or equivalent relative path)

#### Scenario: 添加不存在的功能

- **WHEN** user runs `raven add <不存在的功能>`
- **THEN** CLI displays error with available modules list

#### Scenario: add 需先 init

- **WHEN** user runs `raven add <module>` and raven root directory does NOT exist
- **THEN** CLI SHALL exit with an error instructing user to run `raven init` first

#### Scenario: add 循环依赖报错

- **WHEN** registry contains a circular dependency (A→B→A) and user runs `raven add A` or `raven add B`
- **THEN** CLI SHALL exit with an error describing the cycle

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

The system SHALL provide a `raven init` command that (1) installs AI resources to `.claude/` and (2) initializes the raven root directory (creates directory and `raven.yaml`). The command SHALL NOT install the core module. When re-run, if raven root already exists with `raven.yaml`, the root SHALL NOT be modified; only AI resources SHALL be updated.

#### Scenario: raven init in fresh directory creates both

- **WHEN** user runs `raven init` in a directory with no raven installation
- **THEN** `.claude/skills/` is populated with AI resources
- **AND** `<root>/` directory is created
- **AND** `<root>/raven.yaml` is created with version from registry
- **AND** core module is NOT installed

#### Scenario: raven init idempotent when root already exists

- **WHEN** user runs `raven init` AND raven root directory exists AND `raven.yaml` exists
- **THEN** raven root directory and `raven.yaml` are NOT modified
- **AND** only AI resources are updated (downloaded/copied)

#### Scenario: raven init shows progress

- **WHEN** user runs `raven init` without `--verbose`
- **THEN** a spinner is displayed during installation
- **AND** completion message shows created or modified files

#### Scenario: raven init verbose output

- **WHEN** user runs `raven init --verbose`
- **THEN** detailed progress is logged to console
- **AND** no spinner is displayed

#### Scenario: raven init creates directory structure

- **WHEN** `raven init` runs
- **THEN** `.claude/skills/` directory is created if missing
- **AND** `<root>/` and `raven.yaml` are created if missing
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
- **THEN** skill instructs agent to run `raven status` to check installation before running `raven init` and `raven add core`
- **AND** skill does NOT hardcode "check raven/ exists" or similar logic

#### Scenario: add skill references raven status

- **WHEN** agent reads add skill (packages/ai/add/skill.md)
- **THEN** skill instructs agent to run `raven status` to verify RavenJS is initialized before adding modules
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

- **WHEN** stdout is not a TTY (e.g., `raven init | cat`)
- **THEN** output is plain text without ANSI codes

### Requirement: Loading spinners for async operations

The CLI SHALL show a loading spinner during long-running operations (init, add, update).

#### Scenario: init shows spinner during initialization

- **WHEN** user runs `raven init`
- **THEN** a spinner is shown while AI resources and raven root are being created

#### Scenario: add shows spinner during module download

- **WHEN** user runs `raven add <module>`
- **THEN** a spinner is shown while the module is being downloaded

#### Scenario: update shows spinner during update

- **WHEN** user runs `raven update`
- **THEN** a spinner is shown during the update process

### Requirement: Structured output sections

The CLI SHALL output structured sections (e.g., Modified Files, Required Dependencies) with clear headers and consistent formatting.

#### Scenario: Modified files list has a header

- **WHEN** init, add, or update completes successfully
- **THEN** a "Modified Files" section is shown with a clear header

#### Scenario: Dependencies list uses consistent formatting

- **WHEN** a module with dependencies is added or updated
- **THEN** a "Required Dependencies" section lists packages in `package@version` format

### Requirement: raven status Command

The system SHALL provide a `raven status` command that reports installation status for all registry modules. Each module SHALL have an `installed` field. Core SHALL be treated as a regular module (no separate top-level core field).

#### Scenario: raven status shows all modules with installed flag

- **WHEN** user runs `raven status`
- **THEN** output lists every module in the registry
- **AND** each module has `installed: true` or `installed: false` based on whether the module directory exists with content
- **AND** modules are ordered consistently (e.g., alphabetically by name)

#### Scenario: raven status supports --json

- **WHEN** user runs `raven status --json`
- **THEN** output is valid JSON with `modules` array containing `{ name, installed }` per module
- **AND** no top-level `core` object; core appears in modules

#### Scenario: raven status respects --root

- **WHEN** user runs `raven status --root <dir>` or RAVEN_ROOT is set
- **THEN** status is checked relative to `<cwd>/<dir>/`

#### Scenario: raven status exits 0 when nothing installed

- **WHEN** user runs `raven status` in a project with no RavenJS installation
- **THEN** exit code is 0
- **AND** all modules show installed: false

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

The system SHALL provide a mechanism to install RavenJS modules from a registry that describes module files, external dependencies, and module dependencies (dependsOn). Core is a module like others; it is installed via `raven add core` after `raven init`.

#### Scenario: Initialize new project

- **WHEN** user runs `raven init` in a directory
- **THEN** the system creates `<root>/` directory and `raven.yaml` with version from registry
- **AND** AI resources are copied to `.claude/skills/`
- **AND** core is NOT installed (user runs `raven add core` separately)

#### Scenario: Add module to existing project

- **WHEN** user runs `raven add <module-name>` with a valid module name
- **THEN** the system installs any uninstalled dependsOn modules first
- **AND** downloads module files to `raven/<module-name>/`
- **AND** replaces `@ravenjs/*` imports with relative paths in copied files
- **AND** installs external npm dependencies if any

#### Scenario: Module not found

- **WHEN** user runs `raven add <invalid-module>`
- **THEN** the system displays an error with available modules list

### Requirement: Registry modules include dependsOn

The registry SHALL include a `dependsOn` array for each module, listing module names that the module depends on. Only @ravenjs/* workspace dependencies SHALL be included.

#### Scenario: Module with no workspace deps has empty dependsOn

- **WHEN** a module's package.json has no dependencies on @ravenjs/* packages
- **THEN** its registry entry SHALL have `dependsOn: []`

#### Scenario: Module depending on core has core in dependsOn

- **WHEN** a module's package.json has `"@ravenjs/core": "workspace:*"` in dependencies or devDependencies
- **THEN** its registry entry SHALL have `dependsOn: ["core"]`

### Requirement: generate-registry resolves dependsOn

The generate-registry script SHALL parse each module's package.json and extract @ravenjs/* references from both dependencies and devDependencies, then populate dependsOn in the output registry.

#### Scenario: Circular dependency detection

- **WHEN** generate-registry detects a circular dependency between modules
- **THEN** the script SHALL exit with an error
- **AND** the error message SHALL identify the cycle

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

The system SHALL allow users to configure the RavenJS root directory via `--root` or RAVEN_ROOT.

#### Scenario: Default raven directory

- **WHEN** user runs `raven init` without any options
- **THEN** the system creates `raven/` as the default root directory

#### Scenario: Custom raven directory

- **WHEN** user runs `raven init --root custom-dir`
- **THEN** the system creates `custom-dir/` as the root directory
