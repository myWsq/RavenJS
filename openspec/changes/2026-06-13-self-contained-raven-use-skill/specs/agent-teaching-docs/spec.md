## MODIFIED Requirements

### Requirement: npm 包不打包教学文档，深度教学随 skill 分发

`@raven.js/core` npm 包 SHALL NOT 打包除精简 `README.md` 之外的教学文档文件（SHALL NOT 包含 `GUIDE.md`、`PLUGIN.md`、`DESIGN.md`、`TEACHING.md` 等）。框架的深度教学（概念、架构、设计取舍、API/运行时细节、gotcha、用法示例、分层 pattern）SHALL 由 `raven-use` skill 的 `reference/*` 承载。

#### Scenario: 包内只有精简 README

- **WHEN** Agent 检查 `@raven.js/core` 的发布物或 `packages/core` 目录
- **THEN** 教学文档 SHALL 仅以精简 `README.md` 形式存在于包内
- **AND** SHALL NOT 存在 `GUIDE.md` / `PLUGIN.md` 等额外教学文档文件

### Requirement: 包内 README 为精简门面，深度学习章节归 skill

`packages/core/README.md` SHALL 仅作为面向 npm 的精简门面，包含 OVERVIEW、INSTALL、Quick Start（最小写法 + 各运行时 serve 示例）以及指向 `raven-use` skill 的学习入口。它 SHALL NOT 强制承载 CORE CONCEPTS、ARCHITECTURE、DESIGN DECISIONS、KEY CODE LOCATIONS、EXTENSION POINTS、GOTCHAS、ANTI-PATTERNS、USAGE EXAMPLES 等深度章节——这些 SHALL 由 `raven-use` skill 的 `reference/*` 承载，并按 Agent 学习结构组织。

#### Scenario: README 门面结构

- **WHEN** Agent 阅读 `packages/core/README.md`
- **THEN** README SHALL 包含 OVERVIEW、INSTALL、Quick Start 与指向 `raven-use` skill 的入口
- **AND** 深度概念 / 架构 / 设计取舍 / gotcha / 用法示例 SHALL 在 skill 的 `reference/*` 中提供

### Requirement: 设计取舍的"为什么"由 skill reference 解释

框架设计决策与取舍的"为什么"SHALL 在 `raven-use` skill 的 `reference/*` 中解释，使 Agent 理解某些选择相对替代方案的理由，而不仅是 API 用法。

#### Scenario: skill reference 解释设计决策

- **WHEN** Agent 阅读 skill 的 `reference/api/overview.md` 等文档中的设计取舍说明
- **THEN** Agent SHALL 理解为何做出某些选择（如坐在 Hono 之上、ambient state DI、零参 handler、`register` 同步 / `ready` 异步等）
