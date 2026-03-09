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

The system SHALL provide a `raven init` command that initializes the Raven root directory (creates directory and `raven.yaml`) and installs the bundled Raven core reference code to `<root>/core/`. The command SHALL NOT install AI resources to `.claude/`. When managed example assets are bundled with RavenJS, the command SHALL also install them under `<root>/examples/`. When re-run, if the Raven root already exists with `raven.yaml` and the managed core tree, the command SHALL NOT overwrite local Raven code; users SHALL use `raven sync` to refresh managed assets.

#### Scenario: raven init in fresh directory installs core

- **WHEN** user runs `raven init` in a directory with no Raven installation
- **THEN** `<root>/` directory is created
- **AND** `<root>/raven.yaml` is created with the bundled Raven version
- **AND** core reference code is installed to `<root>/core/`
- **AND** bundled example assets are installed to `<root>/examples/` when present
- **AND** `.claude/skills/` is NOT created or populated by the CLI

#### Scenario: raven init idempotent when root already exists

- **WHEN** user runs `raven init` AND Raven root directory exists AND `raven.yaml` exists AND `<root>/core/` already exists
- **THEN** Raven root directory, `raven.yaml`, and managed Raven code are NOT overwritten
- **AND** the command exits successfully without writing to `.claude/`

#### Scenario: raven init shows progress

- **WHEN** user runs `raven init` without `--verbose`
- **THEN** a spinner is displayed during initialization
- **AND** completion message shows created or managed paths

#### Scenario: raven init verbose output

- **WHEN** user runs `raven init --verbose`
- **THEN** detailed progress is logged to console
- **AND** no spinner is displayed

#### Scenario: raven init creates directory structure

- **WHEN** `raven init` runs
- **THEN** `<root>/`, `<root>/raven.yaml`, and `<root>/core/` are created if missing
- **AND** `<root>/examples/` is created when bundled example assets exist
- **AND** `.claude/skills/` is NOT created by the CLI
- **AND** `.claude/commands/` directory is NOT created

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

The system SHALL provide a `raven status` command that reports installation status for the single Raven core tree. Output SHALL include the current Raven version, language, whether core is installed, the Raven root directory, and the core install directory. The command SHALL NOT return a `modules` array.

#### Scenario: raven status reports single core installation

- **WHEN** user runs `raven status`
- **THEN** output includes `version`, `language`, `installed`, `rootDir`, and `installDir`
- **AND** `installed` is based on whether the managed core directory exists with content
- **AND** output does NOT include a `modules` array

#### Scenario: raven status respects --root

- **WHEN** user runs `raven status --root <dir>` or `RAVEN_ROOT` is set
- **THEN** status is checked relative to `<cwd>/<dir>/`

#### Scenario: raven status exits 0 when nothing installed

- **WHEN** user runs `raven status` in a project with no RavenJS installation
- **THEN** exit code is 0
- **AND** `installed` is `false`
- **AND** output still includes the expected `rootDir` and `installDir`

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

### Requirement: Parallel File Copy from Embedded Source

CLI SHALL 在初始化或同步 Raven 受管理资产时并发地从内嵌 `dist/source/` 目录复制多个文件，以保持 core 与示例资产的复制性能。

#### Scenario: Copy multiple files concurrently

- **WHEN** 系统需要安装或同步 10 个以上的 Raven 受管理文件
- **THEN** 系统 SHALL 并发复制文件

#### Scenario: Copy failure

- **WHEN** 任何受管理文件在 `dist/source/` 中不存在
- **THEN** 系统报错显示缺失的文件路径
- **AND** 系统不留下不完整的受管理文件结果

### Requirement: All CLI outputs in JSON format (Agent-facing)

All RavenJS CLI commands SHALL output JSON format by default, with the exception of `raven init` and `raven guide`.

#### Scenario: CLI command outputs JSON

- **WHEN** an Agent runs any RavenJS CLI command except `raven init` and `raven guide`
- **THEN** the output SHALL be valid JSON

#### Scenario: raven init for human use

- **WHEN** a human runs `raven init`
- **THEN** the output SHALL be human-friendly (non-JSON)

### Requirement: CLI provides structured information for Agent

CLI SHALL 提供当前真实可消费的 Agent 状态信息：当前 Raven 版本、交互语言，以及模块的安装状态与安装目录。CLI SHALL NOT 要求 `raven status` 暴露 `latest version`、`file hashes` 或其他 diff/hash 衍生字段。

#### Scenario: Agent checks status

- **WHEN** an Agent runs `raven status`
- **THEN** 输出 SHALL 包含当前版本、语言和 `modules` 数组
- **AND** 每个模块条目 SHALL 至少包含 `name`、`installed` 和 `installDir`
- **AND** 输出 SHALL NOT 包含 `latest version` 或 `file hashes` 作为必需信息

### Requirement: Configurable Raven Root

The system SHALL allow users to configure the RavenJS root directory via `--root` or RAVEN_ROOT.

#### Scenario: Default raven directory

- **WHEN** user runs `raven init` without any options
- **THEN** the system creates `raven/` as the default root directory

#### Scenario: Custom raven directory

- **WHEN** user runs `raven init --root custom-dir`
- **THEN** the system creates `custom-dir/` as the root directory

### Requirement: raven sync Command

系统 SHALL 提供 `raven sync` 命令，把当前 Raven root 中受管理的 core 代码树与示例资产目录对齐到当前内嵌源码。命令 SHALL 基于固定的受管理目录集合重建结果，而不是基于已安装模块集合或 `dependsOn` 拓扑重建。

#### Scenario: sync 重建 core 并清理残留文件

- **WHEN** user runs `raven sync` and `<root>/core/` 中存在当前内嵌源码未声明的历史残留文件
- **THEN** the system SHALL 重新生成 `<root>/core/`
- **AND** 最终仅保留当前内嵌 core 源码声明的文件内容
- **AND** 历史残留文件 SHALL 从最终目录中消失

#### Scenario: sync 删除遗留模块目录

- **WHEN** user runs `raven sync` and `<root>/sql/` 或其他历史模块目录存在
- **THEN** the system SHALL 从最终同步结果中删除这些遗留模块目录
- **AND** sync 完成后它们 SHALL 不再被视为 Raven 受管理资产

#### Scenario: sync 更新示例资产

- **WHEN** user runs `raven sync` and RavenJS bundled example assets has changed
- **THEN** the system SHALL 更新 `<root>/examples/` 下对应的受管理示例目录
- **AND** 历史残留示例文件 SHALL 被清理

#### Scenario: sync 更新 raven.yaml 版本

- **WHEN** user runs `raven sync` and 当前内嵌版本与 `<root>/raven.yaml` 中记录的版本不同
- **THEN** 成功的 sync SHALL 将 `raven.yaml` 的 `version` 更新为当前内嵌版本
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

### Requirement: raven sync requires a clean Git worktree

`raven sync` SHALL 仅在当前目录位于 Git 工作区且工作区干净时执行。若 Git 不可用、当前目录不在 Git 工作区内，或存在未提交改动，命令 SHALL 在开始 staging 之前失败，并且不得修改 live Raven root。

#### Scenario: sync proceeds in a clean Git worktree

- **WHEN** 用户在 Git 工作区中运行 `raven sync`
- **AND** `git status --porcelain` 返回空结果
- **THEN** 命令 SHALL 继续执行现有的 sync 流程

#### Scenario: sync fails outside a Git worktree

- **WHEN** 用户在不属于 Git 工作区的目录中运行 `raven sync`
- **THEN** CLI SHALL 退出并提示用户先初始化 Git 或创建可恢复备份
- **AND** `<root>/` 下的文件 SHALL 保持不变

#### Scenario: sync fails in a dirty Git worktree

- **WHEN** 用户在 Git 工作区中运行 `raven sync`
- **AND** `git status --porcelain` 返回未提交改动
- **THEN** CLI SHALL 退出并提示用户先提交或暂存改动
- **AND** `<root>/` 下的文件 SHALL 保持不变

#### Scenario: sync fails when Git is unavailable

- **WHEN** 用户运行 `raven sync` 且执行 Git 检查失败，因为系统中不存在 `git` 命令
- **THEN** CLI SHALL 退出并提示用户安装 Git 后再执行同步
- **AND** `<root>/` 下的文件 SHALL 保持不变
