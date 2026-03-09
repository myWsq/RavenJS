## ADDED Requirements

### Requirement: Build embeds core source into dist

构建脚本 SHALL 在生成 CLI 二进制时，将 Raven core 源码复制到 `dist/source/core/`，并将受管理示例资产复制到 `dist/source/examples/`，以便 CLI 运行时无需网络访问即可读取这些文件。

#### Scenario: Build produces embedded core source

- **WHEN** `bun run build` 执行完成
- **THEN** `dist/source/core/` 目录存在
- **AND** 其内容与当前 Raven core 源码一致

#### Scenario: Build produces embedded example assets

- **WHEN** RavenJS 提供受管理示例资产
- **THEN** `bun run build` 完成后 `dist/source/examples/` 目录存在
- **AND** 每个受管理示例目录都被复制到对应路径

#### Scenario: Only tracked managed assets are embedded

- **WHEN** 构建脚本扫描需要内嵌的 Raven 受管理资产
- **THEN** 仅复制受版本控制的源码文件
- **AND** 不将无关的包元数据文件作为运行时安装前提复制到 `dist/source/`

### Requirement: CLI reads managed assets from embedded source

CLI SHALL 从 `join(__dirname, "source", ...)` 对应的内嵌路径读取 Raven core 与示例资产，而不是通过网络下载或依赖外部仓库目录。

#### Scenario: Core install reads from embedded source

- **WHEN** 用户运行 `raven init` 或 `raven sync`
- **THEN** CLI 从 `dist/source/core/` 读取 core 文件内容
- **AND** 不发起任何 HTTP 请求

#### Scenario: Example asset install reads from embedded source

- **WHEN** 用户运行 `raven init` 或 `raven sync` 且存在受管理示例资产
- **THEN** CLI 从 `dist/source/examples/` 读取示例文件内容
- **AND** 不发起任何 HTTP 请求

#### Scenario: Managed asset install fails if embedded source missing

- **WHEN** 任一受管理文件在 `dist/source/` 下不存在
- **THEN** CLI 报错并提示缺失文件
- **AND** 不尝试网络下载作为 fallback

## REMOVED Requirements

### Requirement: Build embeds module source into dist

**Reason**: RavenJS 2.0 不再围绕可安装模块集合构建 CLI，而是围绕固定的 core 与示例资产集合构建。

**Migration**: 改为验证 `dist/source/core/` 与 `dist/source/examples/` 是否生成，而不是验证每个模块都有独立的 `dist/source/<module>/`。

### Requirement: CLI reads modules from embedded source

**Reason**: CLI 运行时不再按模块名读取源码，而是直接读取固定受管理资产路径。

**Migration**: 受管理资产统一从 `dist/source/core/` 与 `dist/source/examples/` 读取，不再使用 `raven add <module>` 流程。
