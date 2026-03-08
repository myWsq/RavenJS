## ADDED Requirements

### Requirement: Pattern 文档必须区分 transport validation 与 domain invariants

RavenJS 的 pattern 文档 SHALL 明确区分 `transport validation`、`domain invariants` 与 `persistence constraints`，并 SHALL 将 `Interface Unit` 描述为 transport validation 的承载层，而不是泛化的业务校验层。

#### Scenario: Agent 阅读 interface 分层说明

- **WHEN** Agent 阅读 `modules/core/pattern/overview.md` 或 `modules/core/pattern/layer-responsibilities.md` 中关于 `Interface Unit` 的说明
- **THEN** 文档 SHALL 将 interface 的校验职责表述为 transport validation
- **AND** SHALL 明确其职责包括请求来源拆分、字段形状约束、解析与基础格式检查
- **AND** SHALL 不再把 interface 描述为核心业务规则的归属层

### Requirement: Pattern 文档必须将 Entity 定义为业务规则唯一归属

RavenJS 的 pattern 文档 SHALL 明确要求所有入口无关的业务规则、状态迁移与领域约束进入 `Entity.create(...)`、entity mutator 或等价实体行为中，而 MUST NOT 将这些规则放在 request schema、handler 或 repository 的隐式副作用中。

#### Scenario: Agent 判断一条规则应放在哪层

- **WHEN** Agent 遇到一条同时可能写在 request schema 与 entity 中的规则
- **THEN** pattern 文档 SHALL 提供“脱离 HTTP/transport 入口后是否仍成立”的判断标准
- **AND** SHALL 指导 Agent 将仍然成立的规则归入 entity

#### Scenario: 写路径示例展示规则归属

- **WHEN** pattern 文档展示一个简单写路径示例
- **THEN** 示例 SHALL 体现 schema 只负责 transport 形状
- **AND** SHALL 体现 entity 承担业务初始化、业务约束或状态迁移

### Requirement: Pattern 文档必须把 request schema 中的业务规则列为反模式

RavenJS 的 pattern 文档 SHALL 将“在 request schema 中编码业务规则”列为显式 anti-pattern，并 SHALL 给出 Agent 可识别的坏味道示例与替代放置方式。

#### Scenario: Agent 自检 request schema 逻辑

- **WHEN** Agent 使用 pattern 文档或自检清单审查一个带 request schema 的写路径
- **THEN** 文档 SHALL 指出把领域约束、状态流转规则或依赖 repository/infra 的判断写入 schema 属于反模式
- **AND** SHALL 指导 Agent 将这些规则迁移到 entity 或显式编排层

### Requirement: Pattern 文档必须以 Agent-first 方式表达边界判断

RavenJS 的 pattern 文档 SHALL 优先使用面向 Agent 决策的短句、放置规则与判定问题来表达边界，而不是仅使用面向人类读者的抽象概念说明。

#### Scenario: Agent 快速浏览 pattern 文档

- **WHEN** Agent 快速浏览 `modules/core/pattern/*` 中与业务代码分层相关的文档
- **THEN** 文档 SHALL 出现可直接用于代码放置判断的语句
- **AND** 这些语句 SHALL 明确区分 schema 检查 shape 与 entity 决定 business meaning
