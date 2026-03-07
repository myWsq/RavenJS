## REMOVED Requirements

### Requirement: Two update modes supported

**Reason**: 当前更新流程不再区分“直接覆盖”和“智能合并”两种 CLI 模式，而是统一要求在干净 Git 基线上执行 `bunx raven sync`，再由 Agent 基于 diff 和文档完成必要适配。

**Migration**: 使用 `raven-update` skill：先确保工作区干净，再升级项目本地 CLI、执行 `bunx raven sync`，最后分析 Git diff 并修复 breaking changes。

### Requirement: Agent detects modifications

**Reason**: 当前流程不再通过 `raven status` 的 hash/diff 信息判断修改，而是直接要求在执行更新前保证 Git 工作区干净。

**Migration**: 在更新前运行 Git 工作区检查；更新后的变化分析改用 Git diff。

### Requirement: Smart merge preserves user changes

**Reason**: 本次更新流程不再承诺通过 CLI 提供“智能合并”能力；用户代码的兼容性调整由 Agent 在 `sync` 之后完成。

**Migration**: 在干净 Git 基线上运行更新，之后由 Agent 根据 diff 与最新文档修改项目代码。

## MODIFIED Requirements

### Requirement: No pre-computed change analysis

系统 SHALL NOT 提供预计算的变更语义分析。变更理解仍由 Agent 完成，但分析入口应基于 Git diff 与更新后的 RavenJS 文档，而不是依赖不存在的 `raven diff` 命令。

#### Scenario: Agent analyzes changes itself

- **WHEN** an Agent needs to understand what changed after a RavenJS update
- **THEN** the Agent SHALL use Git diff together with updated RavenJS docs to analyze the change
- **AND** the system SHALL NOT require a pre-computed change summary from the CLI
