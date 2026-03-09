## REMOVED Requirements

### Requirement: Example plugins are shipped as teaching assets, not installable modules

**Reason**: 移除物理 `examples/` 目录，将示例内容整合到文档中，简化项目结构。

**Migration**: 示例代码将直接嵌入到 plugin 相关文档中（如 `packages/core/GUIDE.md` 或 pattern 文档），无需独立目录。

### Requirement: RavenJS provides a SQL plugin example

**Reason**: 移除物理 `examples/sql-plugin/` 目录，将 SQL plugin 示例代码整合到文档中。

**Migration**: SQL plugin 示例代码将嵌入到 `packages/core/pattern/runtime-assembly.md` 或相关 GUIDE 文档中，保持教学价值但无需独立文件。

## ADDED Requirements

### Requirement: Plugin 示例以文档形式存在

RavenJS SHALL 在 plugin 相关文档中直接提供示例代码，而不是作为独立的物理目录。示例代码 SHALL 嵌入到 `packages/core/GUIDE.md` 或 pattern 文档中，供 Agent 和用户学习。

#### Scenario: 文档中包含完整示例

- **WHEN** Agent 或用户阅读 plugin 相关文档
- **THEN** 文档中 SHALL 包含完整的 SQL plugin 示例代码
- **AND** 示例 SHALL 展示 `definePlugin`、`defineAppState` 与 `Bun.SQL` 的集成模式

#### Scenario: 无物理示例目录

- **WHEN** 用户运行 `raven init`
- **THEN** Raven root 下 SHALL NOT 创建 `examples/` 目录
- **AND** 所有示例 SHALL 仅存在于文档中
