# pattern-guided-skills Specification

## Purpose

TBD - created by archiving change add-pattern-aware-agent-workflow. Update Purpose after archive.

## Requirements

### Requirement: 技能在 RavenJS 业务代码任务中必须加载 pattern 文档

RavenJS 的写码与学习技能 SHALL 在 Agent 处理 RavenJS 业务代码或运行时装配任务时，显式要求其读取 `modules/core/pattern/*` 中与当前任务相关的文档，而不能只停留在 API、README 或源码浏览层面。

#### Scenario: 业务代码任务加载 pattern 总览与分层规则

- **WHEN** Agent 使用 `raven-learn` 或 `raven-use` 处理 route、handler、entity、repository、command、query、projection、dto 等业务代码任务
- **THEN** 技能 SHALL 指导 Agent 先读取 `modules/core/pattern/overview.md`
- **AND** SHALL 根据任务继续分流到 `layer-responsibilities.md`、`conventions.md` 或 `anti-patterns.md`

#### Scenario: 运行时装配任务加载 Raven 专属 pattern 文档

- **WHEN** Agent 处理 plugin、scoped state、lifecycle hook 或 `app.ts` 组合根相关任务
- **THEN** 技能 SHALL 指导 Agent 读取 `modules/core/pattern/runtime-assembly.md`
- **AND** SHALL 明确区分该学习路径与纯 API 或源码入口

### Requirement: 技能在写代码前必须完成 Pattern Plan

RavenJS 的写码技能 SHALL 在 Agent 开始修改 RavenJS 业务代码前，要求其先完成一个简短的 Pattern Plan，对任务类型、所需层级和目标文件布局做出明确判断。

#### Scenario: 简单写路径保持轻量

- **WHEN** 任务是单一实体路径上的简单写操作，且不存在可复用的多实体编排需求
- **THEN** Pattern Plan SHALL 将其识别为 simple write
- **AND** SHALL 明确不引入 `Command`、`Query` 或 `Projection` 等额外层

#### Scenario: 可复用工作流引入对应扩展层

- **WHEN** 任务跨越多个实体写流程，或包含复杂且可复用的查询逻辑
- **THEN** Pattern Plan SHALL 将其识别为 reusable write 或 complex read
- **AND** SHALL 明确选择 `Command` 或 `Query + Projection` 作为目标扩展点

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
