## MODIFIED Requirements

### Requirement: Plugin 示例以 skill 文档形式存在

RavenJS SHALL 在 `raven-use` skill 的文档中直接提供插件示例代码，而不是作为独立的物理目录，也不再嵌入 npm 包内的 `packages/core/GUIDE.md`。示例代码 SHALL 嵌入到 skill 自带的 `reference/api/plugins.md`（及配套的 `reference/runtime-assembly.md`）中，供 Agent 和用户学习。

#### Scenario: 文档中包含完整示例

- **WHEN** Agent 或用户阅读 `raven-use` skill 的插件文档
- **THEN** `reference/api/plugins.md` SHALL 包含完整的数据库插件示例代码
- **AND** 示例 SHALL 展示 `definePlugin`、`defineAppState` 与数据库客户端（运行时无关的占位类型）的集成模式

#### Scenario: 无物理示例目录

- **WHEN** 检查框架仓库与 npm 包的分发物
- **THEN** SHALL NOT 存在独立的 `examples/` 物理目录
- **AND** 所有插件示例 SHALL 仅存在于 `raven-use` skill 的 `reference/*` 文档中
