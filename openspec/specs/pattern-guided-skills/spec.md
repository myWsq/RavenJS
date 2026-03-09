# pattern-guided-skills Specification

## Purpose

定义 RavenJS 的技能在处理业务代码与运行时装配任务时，如何显式加载并应用 pattern 文档，尤其是让 Agent 在生成代码前先完成分层判断、在生成代码后执行 pattern 自检。

## Requirements

### Requirement: 技能在 RavenJS 业务代码任务中必须加载 pattern 文档

RavenJS 的写码与学习技能 SHALL 在 Agent 处理 RavenJS 业务代码或运行时装配任务时，显式要求其读取 `modules/core/pattern/*` 中与当前任务相关的文档，而不能只停留在 API、README 或源码浏览层面。

对于包含 request schema、handler、entity、repository、command、query、dto 或查询结果映射的业务代码任务，技能 SHALL 进一步要求 Agent 应用 pattern 中关于 `transport validation`、`domain invariants` 与 `persistence constraints` 的边界语言，而 MUST NOT 将 request schema 当作业务规则的默认落点，也 MUST NOT 把 `Projection` 当作默认需要判断或引入的独立层。

#### Scenario: 业务代码任务加载 pattern 总览与分层规则

- **WHEN** Agent 使用 `raven-learn` 或 `raven-use` 处理 route、handler、entity、repository、command、query、dto 或查询结果映射等业务代码任务
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

### Requirement: 技能在写代码前必须完成 Pattern Plan

RavenJS 的写码技能 SHALL 在 Agent 开始修改 RavenJS 业务代码前，要求其先完成一个简短的 Pattern Plan，对任务类型、所需层级和目标文件布局做出明确判断。对于读路径建模，Pattern Plan SHALL 使用 `DTO`、查询结果映射或 `complex read` 等更稳定的语言，而 MUST NOT 默认把 `Projection` 作为推荐扩展层。

#### Scenario: 简单写路径保持轻量

- **WHEN** 任务是单一实体路径上的简单写操作，且不存在可复用的多实体编排需求
- **THEN** Pattern Plan SHALL 将其识别为 simple write
- **AND** SHALL 明确不引入 `Command`、`Query` 或额外的读模型抽象

#### Scenario: 可复用工作流引入对应扩展层

- **WHEN** 任务跨越多个实体写流程，或包含复杂且可复用的查询逻辑
- **THEN** Pattern Plan SHALL 将其识别为 reusable write 或 complex read
- **AND** SHALL 明确选择 `Command` 或 `Query + DTO / 查询结果映射` 作为目标扩展点

### Requirement: 技能在完成代码生成后必须执行 pattern 自检

RavenJS 的写码技能 SHALL 在 Agent 准备结束任务前，要求其依据 `modules/core/pattern/anti-patterns.md` 与 `modules/core/pattern/conventions.md` 对本次产出执行显式自检。

#### Scenario: 自检覆盖常见 anti-pattern

- **WHEN** Agent 完成了一次 RavenJS 代码生成或修改
- **THEN** 技能 SHALL 要求其检查 entity、repository、hook、plugin 等边界是否违反已记录的 anti-pattern
- **AND** SHALL 在发现偏离时调整代码或明确说明偏离原因

#### Scenario: 自检覆盖文件布局与命名

- **WHEN** 本次变更新增了 RavenJS 业务文件或运行时装配文件
- **THEN** 技能 SHALL 要求其检查文件放置位置与命名是否符合 `modules/core/pattern/conventions.md`
- **AND** SHALL 对任何刻意的命名或目录偏离进行显式说明

### Requirement: 技能在 Pattern Plan 中必须判断 dependency placement

RavenJS 的写码与学习技能 SHALL 在 Agent 规划可复用依赖时，显式判断该依赖属于 runtime state 还是 `Object Style Service`。技能 MUST NOT 因其需要复用就默认写成 class 或引入 `AppState`。若依赖不需要由 Raven runtime 管理初始化、生命周期或作用域，技能 SHALL 优先保持 plain object / function collection 的直接导出模块。

#### Scenario: Pattern Plan 遇到普通 Object Style Service

- **WHEN** Agent 在 Pattern Plan 中规划一个轻量 service、helper 或其它可复用模块
- **THEN** 技能 SHALL 要求其先判断该依赖是否真的需要 plugin 写入与 state 读取
- **AND** 若答案是否定的，SHALL 指导 Agent 采用 `Object Style Service`，而不是默认写成 class 或创建 `AppState`

#### Scenario: Pattern Plan 识别 Repository 是特化 Object Style Service

- **WHEN** Agent 在 Pattern Plan 中规划一个承担 `Entity <-> DB` 的模块
- **THEN** 技能 SHALL 指导 Agent 将其视为 `Repository`
- **AND** SHALL 明确这是 `Object Style Service` 的特化命名，而不是另一套 class-based service 模式

#### Scenario: Pattern Plan 遇到真正的 runtime dependency

- **WHEN** Agent 在 Pattern Plan 中规划数据库客户端、配置、缓存客户端、当前用户上下文或其它明确依赖 runtime 生命周期的对象
- **THEN** 技能 SHALL 指导 Agent 进入 `modules/core/pattern/runtime-assembly.md` 的学习路径
- **AND** SHALL 根据其生命周期选择 `AppState` 或 `RequestState`
