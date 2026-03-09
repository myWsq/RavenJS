## MODIFIED Requirements

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

### Requirement: Parallel File Copy from Embedded Source

CLI SHALL 在初始化或同步 Raven 受管理资产时并发地从内嵌 `dist/source/` 目录复制多个文件，以保持 core 与示例资产的复制性能。

#### Scenario: Copy multiple files concurrently

- **WHEN** 系统需要安装或同步 10 个以上的 Raven 受管理文件
- **THEN** 系统 SHALL 并发复制文件

#### Scenario: Copy failure

- **WHEN** 任何受管理文件在 `dist/source/` 中不存在
- **THEN** 系统报错显示缺失的文件路径
- **AND** 系统不留下不完整的受管理文件结果

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

## REMOVED Requirements

### Requirement: add 命令添加功能模块

**Reason**: RavenJS 2.0 不再支持多模块安装模型，`core` 作为唯一受管理代码树由 `raven init` 直接安装。

**Migration**: 使用 `raven init` 初始化并安装 core；不再存在 `raven add core` 或 `raven add <module>` 的替代命令。

### Requirement: Registry-Based Module Installation

**Reason**: CLI 不再通过 registry 描述模块集合、模块依赖与模块安装流程，而是直接管理固定的 core 与示例资产集合。

**Migration**: 使用 `raven init` 安装 Raven core，使用 `raven sync` 对齐受管理资产；不要再依赖 registry 中的模块列表。

### Requirement: Registry modules include dependsOn

**Reason**: RavenJS 2.0 删除模块拓扑安装模型，不再需要 `dependsOn` 描述模块间依赖。

**Migration**: 不再生成或消费 `dependsOn`；CLI 只同步固定的受管理资产目录。

### Requirement: generate-registry resolves dependsOn

**Reason**: 构建流程不再从模块依赖关系推导安装顺序，因此无需解析 `dependsOn`。

**Migration**: 构建阶段改为生成单一 core 与示例资产的受管理清单，而不是依赖解析结果。
