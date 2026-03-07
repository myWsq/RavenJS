# CLI Tool Specification

> **Migration Note**: This spec consolidates following original specs:
>
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

`raven add <module>` SHALL copy the specified module's code to the project from the embedded source (`dist/source/<module>/`). Before installing the target module, the system SHALL install any uninstalled dependencies listed in the registry's dependsOn for that module. Dependencies SHALL be installed in topological order. When copying module files, the system SHALL replace `@ravenjs/<module>` import paths with the correct relative path (e.g., `../core`) before writing.

#### Scenario: 添加 core 模块

- **WHEN** user runs `raven add core`
- **THEN** core module is installed to `<root>/core/`
- **AND** skill can use this command to install RavenJS core

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

The system SHALL update installed RavenJS modules when `raven update` is executed. The system SHALL NOT install or update AI resources (skills); skill installation and updates are handled by the install-raven CLI.

#### Scenario: raven update updates framework modules

- **WHEN** user runs `raven update`
- **THEN** all installed modules in `raven/` are updated
- **AND** `raven.yaml` is updated with latest version

#### Scenario: raven update when .claude exists

- **WHEN** user runs `raven update` AND `.claude/` exists
- **THEN** only framework modules in `raven/` are updated
- **AND** NO files in `.claude/skills/` are modified by the CLI

#### Scenario: raven update when AI resources not installed

- **WHEN** user runs `raven update` AND `.claude/` does NOT exist
- **THEN** only framework modules are updated
- **AND** no error is raised about missing AI resources

#### Scenario: raven update shows progress

- **WHEN** user runs `raven update`
- **THEN** progress indicator shows framework module updates
- **AND** final summary lists modified files (framework only)

### Requirement: raven init Command

The system SHALL provide a `raven init` command that initializes the raven root directory (creates directory and `raven.yaml`). The command SHALL NOT install AI resources to `.claude/`; the command SHALL NOT install the core module. When re-run, if raven root already exists with `raven.yaml`, the root SHALL NOT be modified.

#### Scenario: raven init in fresh directory creates root only

- **WHEN** user runs `raven init` in a directory with no raven installation
- **THEN** `<root>/` directory is created
- **AND** `<root>/raven.yaml` is created with version from registry
- **AND** core module is NOT installed
- **AND** `.claude/skills/` is NOT created or populated by the CLI

#### Scenario: raven init idempotent when root already exists

- **WHEN** user runs `raven init` AND raven root directory exists AND `raven.yaml` exists
- **THEN** raven root directory and `raven.yaml` are NOT modified
- **AND** the command exits successfully without writing to `.claude/`

#### Scenario: raven init shows progress

- **WHEN** user runs `raven init` without `--verbose`
- **THEN** a spinner is displayed during initialization
- **AND** completion message shows created or modified files

#### Scenario: raven init verbose output

- **WHEN** user runs `raven init --verbose`
- **THEN** detailed progress is logged to console
- **AND** no spinner is displayed

#### Scenario: raven init creates directory structure

- **WHEN** `raven init` runs
- **THEN** `<root>/` and `raven.yaml` are created if missing
- **AND** `.claude/skills/` is NOT created by the CLI
- **AND** `.claude/commands/` directory is NOT created (commands are deprecated)

### Requirement: raven init Command Options

The system SHALL support standard CLI options for `raven init`. The option for loading AI resources from a local path (e.g. `--source`) is removed; AI resource installation is handled by install-raven.

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
- **THEN** a spinner is shown while the raven root and `raven.yaml` are being created

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

The system SHALL provide a mechanism to install RavenJS modules from a registry that describes module files, external dependencies, and module dependencies (dependsOn). Core is a module like others; it is installed via `raven add core` after `raven init`. Module files are read from the embedded source directory (`dist/source/`) rather than downloaded from a network source.

#### Scenario: Initialize new project

- **WHEN** user runs `raven init` in a directory
- **THEN** the system creates `<root>/` directory and `raven.yaml` with version from registry
- **AND** core is NOT installed (user runs `raven add core` separately)
- **AND** the CLI does NOT copy AI resources to `.claude/skills/` (use install-raven for that)

#### Scenario: Add module to existing project

- **WHEN** user runs `raven add <module-name>` with a valid module name
- **THEN** the system installs any uninstalled dependsOn modules first
- **AND** copies module files from `dist/source/<module-name>/` to `raven/<module-name>/`
- **AND** replaces `@ravenjs/*` imports with relative paths in copied files
- **AND** installs external npm dependencies if any

#### Scenario: Module not found

- **WHEN** user runs `raven add <invalid-module>`
- **THEN** the system displays an error with available modules list

### Requirement: Registry modules include dependsOn

The registry SHALL include a `dependsOn` array for each module, listing module names that the module depends on. Only @ravenjs/\* workspace dependencies SHALL be included.

#### Scenario: Module with no workspace deps has empty dependsOn

- **WHEN** a module's package.json has no dependencies on @ravenjs/\* packages
- **THEN** its registry entry SHALL have `dependsOn: []`

#### Scenario: Module depending on core has core in dependsOn

- **WHEN** a module's package.json has `"@ravenjs/core": "workspace:*"` in dependencies or devDependencies
- **THEN** its registry entry SHALL have `dependsOn: ["core"]`

### Requirement: generate-registry resolves dependsOn

The generate-registry script SHALL parse each module's package.json and extract @ravenjs/\* references from both dependencies and devDependencies, then populate dependsOn in the output registry.

#### Scenario: Circular dependency detection

- **WHEN** generate-registry detects a circular dependency between modules
- **THEN** the script SHALL exit with an error
- **AND** the error message SHALL identify the cycle

### Requirement: Parallel File Copy from Embedded Source

CLI SHALL 在安装模块时并发地从内嵌 `dist/source/` 目录复制多个文件，以保持安装性能。

#### Scenario: Copy multiple files concurrently

- **WHEN** 系统需要为一个模块安装 10 个文件
- **THEN** 系统 SHALL 并发复制文件（而非顺序逐一）

#### Scenario: Copy failure

- **WHEN** 任何文件在 `dist/source/` 中不存在
- **THEN** 系统报错显示缺失的文件路径
- **AND** 系统不留下不完整的安装文件

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
- **THEN** the output SHALL be the contents of `GUIDE.md` from the installed module directory (`<root>/<module>/GUIDE.md`)
- **AND** the content SHALL be output as plain text (not wrapped in XML or JSON)

#### Scenario: guide 命令在模块缺少 GUIDE.md 时报错

- **WHEN** an Agent runs `raven guide <module>`
- **AND** the module is installed but `<root>/<module>/GUIDE.md` does not exist
- **THEN** the CLI SHALL exit with an error message
- **AND** no guide content SHALL be output

### Requirement: Configurable Raven Root

The system SHALL allow users to configure the RavenJS root directory via `--root` or RAVEN_ROOT.

#### Scenario: Default raven directory

- **WHEN** user runs `raven init` without any options
- **THEN** the system creates `raven/` as the default root directory

#### Scenario: Custom raven directory

- **WHEN** user runs `raven init --root custom-dir`
- **THEN** the system creates `custom-dir/` as the root directory

### Requirement: raven sync Command

系统 SHALL 提供 `raven sync` 命令，把当前 Raven root 中已安装模块的本地代码对齐到当前 registry。命令 SHALL 以 `<root>/` 下现有模块目录为同步起点，基于 registry 的 `dependsOn` 计算当前需要保留的模块集合，并从内嵌 `dist/source/` 重新生成这些模块目录，而不是在原目录上做简单覆盖。

#### Scenario: sync 重建模块并清理残留文件

- **WHEN** user runs `raven sync` and `<root>/sql/` 中存在当前 registry 未声明的历史残留文件
- **THEN** the system SHALL 重新生成 `<root>/sql/` 的模块目录
- **AND** 仅保留当前 registry 为 `sql` 声明的文件内容
- **AND** 历史残留文件 SHALL 从最终目录中消失

#### Scenario: sync 补齐新增 dependsOn 模块

- **WHEN** 某个本地已安装模块在当前 registry 中新增了 `dependsOn: ["core"]`
- **AND** `<root>/core/` 当前不存在
- **THEN** `raven sync` SHALL 在同一次同步中安装 `<root>/core/`
- **AND** 最终本地模块集合 SHALL 包含该依赖模块

#### Scenario: sync 删除 registry 已移除模块

- **WHEN** user runs `raven sync` and `<root>/legacy-module/` 存在
- **AND** `legacy-module` 已不在当前 registry 中
- **THEN** the system SHALL 从最终同步结果中删除 `<root>/legacy-module/`
- **AND** sync 完成后该模块目录 SHALL 不再存在

#### Scenario: sync 更新 raven.yaml 版本

- **WHEN** user runs `raven sync` and 当前 registry 版本与 `<root>/raven.yaml` 中记录的版本不同
- **THEN** 成功的 sync SHALL 将 `raven.yaml` 的 `version` 更新为当前 registry 版本
- **AND** 已有的 `language` 字段 SHALL 被保留

#### Scenario: sync 需先 init

- **WHEN** user runs `raven sync` and Raven root 目录不存在
- **THEN** CLI SHALL 退出并提示用户先运行 `raven init`

### Requirement: Atomic raven sync

`raven sync` SHALL 以 Raven root 为粒度进行事务式提交。系统 SHALL 在 staging 目录中先构建完整目标状态，在 staging 成功前不得修改 live root；如果最终切换失败，系统 SHALL 恢复同步前的原始 root。

#### Scenario: staging 失败时保持原样

- **WHEN** `raven sync` 在 staging 阶段遇到错误，例如某个内嵌源文件缺失
- **THEN** the command SHALL 以错误结束
- **AND** 原始 `<root>/` 下的文件内容 SHALL 保持不变

#### Scenario: 最终切换失败时自动回滚

- **WHEN** staging 已完成，但将 staging root 切换为正式 `<root>/` 时发生失败
- **THEN** the system SHALL 自动恢复同步前的 `<root>/`
- **AND** 命令结束后用户 SHALL 不会看到部分模块已更新、部分模块仍为旧版本的中间态
