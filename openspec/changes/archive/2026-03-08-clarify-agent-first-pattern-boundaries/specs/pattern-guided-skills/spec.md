## MODIFIED Requirements

### Requirement: 技能在 RavenJS 业务代码任务中必须加载 pattern 文档

RavenJS 的写码与学习技能 SHALL 在 Agent 处理 RavenJS 业务代码或运行时装配任务时，显式要求其读取 `modules/core/pattern/*` 中与当前任务相关的文档，而不能只停留在 API、README 或源码浏览层面。

对于包含 request schema、handler、entity、repository、command、query、projection、dto 的业务代码任务，技能 SHALL 进一步要求 Agent 应用 pattern 中关于 `transport validation`、`domain invariants` 与 `persistence constraints` 的边界语言，而 MUST NOT 将 request schema 当作业务规则的默认落点。

#### Scenario: 业务代码任务加载 pattern 总览与分层规则

- **WHEN** Agent 使用 `raven-learn` 或 `raven-use` 处理 route、handler、entity、repository、command、query、projection、dto 等业务代码任务
- **THEN** 技能 SHALL 指导 Agent 先读取 `modules/core/pattern/overview.md`
- **AND** SHALL 根据任务继续分流到 `layer-responsibilities.md`、`conventions.md` 或 `anti-patterns.md`

#### Scenario: 运行时装配任务加载 Raven 专属 pattern 文档

- **WHEN** Agent 处理 plugin、scoped state、lifecycle hook 或 `app.ts` 组合根相关任务
- **THEN** 技能 SHALL 指导 Agent 读取 `modules/core/pattern/runtime-assembly.md`
- **AND** SHALL 明确区分该学习路径与纯 API 或源码入口

#### Scenario: 技能要求 Agent 识别业务规则边界

- **WHEN** Agent 准备实现带 request schema 的写路径
- **THEN** 技能 SHALL 要求 Agent 明确区分 transport validation 与 domain invariants
- **AND** SHALL 指导 Agent 将入口无关的业务规则收敛到 entity，而不是收敛到 request schema
