## MODIFIED Requirements

### Requirement: CLI provides structured information for Agent

CLI SHALL 向 Agent 提供当前真实可消费的单一 core 状态信息：当前 Raven 版本、交互语言、Raven root 目录、core 安装目录以及 `installed` 布尔值。CLI SHALL NOT 要求 `raven status` 提供 `modules` 数组、模块安装目录列表或旧的 diff/hash 衍生字段。

#### Scenario: Agent checks status

- **WHEN** an Agent runs `raven status`
- **THEN** 输出 SHALL 包含当前版本、语言、`rootDir`、`installDir` 和 `installed`
- **AND** 输出 SHALL NOT 包含 `modules` 数组
- **AND** 输出 SHALL NOT 依赖 `latest version` 或 `file hashes`

#### Scenario: Agent checks status before Raven is installed

- **WHEN** an Agent runs `raven status` in a project where Raven root does not exist
- **THEN** 输出 SHALL 仍包含 `rootDir` 与 `installDir`
- **AND** `installed` SHALL 为 `false`
