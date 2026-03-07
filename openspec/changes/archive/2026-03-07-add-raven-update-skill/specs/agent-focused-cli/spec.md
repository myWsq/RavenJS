## MODIFIED Requirements

### Requirement: CLI provides structured information for Agent

CLI SHALL 向 Agent 提供当前真实可消费的状态信息：当前 Raven 版本、交互语言，以及模块的安装状态与安装目录。CLI SHALL NOT 要求 `raven status` 提供 `latest version`、`modified file status` 或 `file hashes` 这类旧字段。

#### Scenario: Agent checks status

- **WHEN** an Agent runs `raven status`
- **THEN** 输出 SHALL 包含当前版本、语言和 `modules` 数组
- **AND** 每个模块条目 SHALL 至少包含 `name`、`installed` 和 `installDir`
- **AND** 输出 SHALL NOT 依赖 `latest version` 或 `file hashes`

## REMOVED Requirements

### Requirement: CLI provides guidance entry points

**Reason**: 当前 CLI 不提供 `raven guide`，更新流程也已改为由 Agent 直接读取已安装模块文档并结合 Git diff 分析变化。

**Migration**: 使用 `raven status` 获取模块安装位置，再直接读取模块目录中的 `GUIDE.md`、`README.md` 和 pattern 文档；更新差异分析改用 Git diff。
