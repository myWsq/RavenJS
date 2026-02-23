# CLI Tool Delta

## REMOVED Requirements

### Requirement: install 命令安装项目

**Reason**: install 命令已移除，由 init（根目录初始化）和 add core（安装 core 模块）替代。

**Migration**: 执行 `raven init` 创建根目录和 raven.yaml，再执行 `raven add core` 安装 core 模块。

### Requirement: install skill references raven status

**Reason**: install 命令已移除，install skill 将改用 add core。

**Migration**: raven-install skill 改为指导执行 `raven init` 后 `raven add core`。

### Requirement: install shows spinner during download

**Reason**: install 命令已移除。

**Migration**: add 命令仍显示 spinner；init 显示 AI 资源下载 spinner。

## MODIFIED Requirements

### Requirement: raven init Command

The system SHALL provide a `raven init` command that (1) installs AI resources to `.claude/` and (2) initializes the raven root directory (creates directory and `raven.yaml`). The command SHALL NOT install the core module. When re-run, if raven root already exists with `raven.yaml`, the root SHALL NOT be modified; only AI resources SHALL be updated.

#### Scenario: raven init installs AI resources

- **WHEN** user runs `raven init`
- **THEN** AI skills are copied to `.claude/skills/`
- **AND** raven root directory and `raven.yaml` are created if not present
- **AND** success message is displayed
- **AND** core module is NOT installed

#### Scenario: raven init shows progress

- **WHEN** user runs `raven init` without `--verbose`
- **THEN** a spinner is displayed during installation
- **AND** completion message shows created files

#### Scenario: raven init verbose output

- **WHEN** user runs `raven init --verbose`
- **THEN** detailed progress is logged to console
- **AND** no spinner is displayed

#### Scenario: raven init idempotent when root exists

- **WHEN** user runs `raven init` AND raven root exists AND `raven.yaml` exists
- **THEN** raven root and raven.yaml are NOT modified
- **AND** only AI resources are updated

#### Scenario: raven init creates directory structure

- **WHEN** `raven init` runs
- **THEN** `.claude/skills/` directory is created if missing
- **AND** `<root>/` and `raven.yaml` are created if missing
- **AND** `.claude/commands/` directory is NOT created (commands are deprecated)

### Requirement: raven status Command

The system SHALL provide a `raven status` command that reports installation status for all registry modules. Each module SHALL have an `installed` field. Core SHALL be treated as a regular module (no separate top-level core field).

#### Scenario: raven status shows all modules with installed flag

- **WHEN** user runs `raven status`
- **THEN** output lists every module in the registry
- **AND** each module has `installed: true` or `installed: false` based on whether the module directory exists with content

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

### Requirement: add 命令添加功能模块

`raven add <module>` SHALL copy the specified module's code to the project. Before installing the target module, the system SHALL install any uninstalled dependencies listed in the registry's dependsOn for that module. Dependencies SHALL be installed in topological order.

#### Scenario: 添加 jtd-validator

- **WHEN** user runs `raven add jtd-validator`
- **THEN** if core (a dependency) is not installed, core is installed first
- **AND** jtd-validator module code is copied to `<root>/jtd-validator/`

#### Scenario: 添加不存在的功能

- **WHEN** user runs `raven add <不存在的功能>`
- **THEN** CLI displays error with available modules list

#### Scenario: 添加 core 模块

- **WHEN** user runs `raven add core`
- **THEN** core module is installed to `<root>/core/`
- **AND** skill can use this command to install RavenJS core
