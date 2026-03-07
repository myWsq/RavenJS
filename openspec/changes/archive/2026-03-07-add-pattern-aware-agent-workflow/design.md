## Context

当前 RavenJS 已经具备三类和 Agent 教学直接相关的资产：

- `modules/core/pattern/*`：定义 Interface / Entity / Repository / Command / Query / Projection / Runtime Assembly 的分层边界、命名约定与 anti-pattern。
- `modules/core/GUIDE.md` 与 `modules/core/README.md`：负责把 Agent 引导到 core 的 API、源码结构和关键实现。
- `packages/install-raven/skills/*`：负责定义 Agent 的实际工作流，尤其是 `raven-learn` 和 `raven-use`。

问题在于这三类资产尚未形成闭环。pattern 文档已经成熟，但 `raven-learn` 目前只要求 Agent 读取 GUIDE 及其引用文件，`raven-use` 也只要求“先学习，再写代码”。这会导致 Agent 学到的是 API 和源码位置，而不是“在什么任务下应该用什么层、什么文件、什么边界”。

本次变更需要把 pattern 从“可选参考资料”提升为“Agent 工作流中的显式约束”，同时保持 RavenJS 一贯的轻量风格，避免把所有任务都机械地扩展成多层结构。

## Goals / Non-Goals

**Goals:**

- 让 `raven-learn` / `raven-use` 在 RavenJS 业务代码任务中显式引导 Agent 读取 pattern 文档
- 在写代码前增加一个轻量的 pattern 分类与结构规划步骤
- 在写代码后增加一个 anti-pattern 自检步骤，减少常见分层错误
- 更新 core 的 GUIDE / README，使 Agent 能明确区分“看 API/源码”和“看 pattern/结构规则”的入口

**Non-Goals:**

- 不新增新的 CLI 子命令，也不把 pattern 规则编码进 `raven status` / `raven guide`
- 不在本次引入新的静态分析器、lint rule 或自动修复器
- 不要求所有 RavenJS 任务都落成完整的 Interface / Entity / Repository / Command / Query / Projection 六层结构
- 不重写 `modules/core/pattern/*` 的核心理论，只调整其在 Agent 学习路径中的使用方式

## Decisions

### Decision 1: Pattern 约束首先落在 skills，而不是 CLI

本次把 pattern-aware 行为主要放在 `raven-learn`、`raven-use` 等技能中，而不是新增 CLI 输出或专门命令。

原因：

- pattern 的核心问题是 Agent 工作流，而不是项目状态探测
- CLI 适合提供状态、安装信息和稳定的机器输出，不适合承载高频演化的教学决策树
- skills 已经是 RavenJS 面向 Agent 的主入口，把 pattern 约束放在这里可以直接影响真实生成行为

备选方案：为 CLI 增加 pattern guide / plan 命令。  
放弃原因：会让工具边界变重，也会把本应由技能编排的教学流程固化到命令层。

### Decision 2: 在 `raven-use` 中增加“任务分类 -> Pattern Plan -> 写代码”三段式

`raven-use` 在完成模块学习后，不直接进入写代码，而是先执行一个轻量的 Pattern Plan。这个计划至少要回答：

- 当前任务属于 simple write、reusable write、complex read，还是 runtime assembly
- 需要哪些层，哪些层明确不需要
- 目标文件布局和命名是否符合 pattern 约定
- 业务规则、数据访问、hook、plugin 各自应该放在哪里

这样做的核心价值不是让 Agent 输出长篇分析，而是逼它在写代码前做一次结构判断，避免直接进入“边写边想”的状态。

备选方案：只要求 Agent 阅读 pattern 文档，不要求产出规划。  
放弃原因：只读不分类，Agent 很容易回到凭直觉生成代码的旧路径，pattern 难以稳定落地。

### Decision 3: Pattern Plan 必须内建“默认轻量”原则

Pattern Plan 不应把每个任务都膨胀成多层目录。skills 必须把以下原则作为显式约束：

- simple write 可以停留在 interface + entity/repository
- 只有可复用的多实体写流程才引入 `Command`
- 只有复杂且可复用的查询才引入 `Query + Projection`
- runtime assembly 问题优先走 plugin / state / hook / app 组合根文档，而不是硬套业务分层

这条决策直接复用现有 pattern 文档中的 “Do not add more layers by default” 与 anti-pattern 原则，目标是让 Agent 学会“何时不抽象”。

备选方案：为不同任务输出固定模板目录。  
放弃原因：固定模板会提高一致性，但会显著增加过度设计风险，不符合 RavenJS 当前强调的轻量模式。

### Decision 4: `modules/core/GUIDE.md` 作为 pattern 分流入口，`pattern/*` 作为规则正文

`modules/core/GUIDE.md` 将继续承担“先读什么、遇到什么问题看哪里”的导航职责，但需要新增对 pattern 文档的显式分流，例如：

- 业务接口、实体、仓储、查询、DTO 问题 -> `pattern/overview.md` + 对应子文档
- plugin、state、hook、app 组合问题 -> `pattern/runtime-assembly.md`
- 代码审查或收尾自检 -> `pattern/anti-patterns.md`

这样可以避免把大量规则复制到 GUIDE 或 README 中，保持单一事实来源。

备选方案：把 pattern 规则直接复制进 README 或 GUIDE。  
放弃原因：会造成重复维护，也会让入口文档再次膨胀。

### Decision 5: 第一阶段采用“文档 + 技能自检”而非静态强校验

本次只要求 Agent 在生成后基于 `anti-patterns.md` 做显式自检，不要求仓库新增静态分析工具。

原因：

- 现阶段最主要的问题是 Agent 没有稳定走 pattern 流程，而不是没有 lint
- anti-pattern 很多依赖语义判断，例如“业务逻辑是否混入 hook”“是否过早引入 Command”，静态规则难以在第一阶段准确表达
- 先把 workflow 固化后，再考虑是否要把其中一部分沉淀成自动检查

备选方案：直接新增 lint / code review 机器人规则。  
放弃原因：实现成本高，而且在 pattern 还未成为显式工作流前，强校验会产生大量噪音。

## Risks / Trade-offs

- [Risk] skills 变长后，Agent 执行成本和 token 消耗上升 -> Mitigation: Pattern Plan 保持轻量，只要求完成分类、边界和目标文件判断，不要求长篇输出
- [Risk] Agent 可能把 pattern 机械化，导致小任务过度设计 -> Mitigation: 在 skills 和 GUIDE 中显式强调“默认轻量”“非复用场景不要引入额外层”
- [Risk] GUIDE、README 与 pattern 文档可能出现内容重复或不一致 -> Mitigation: GUIDE 只负责导航和分流，规则正文统一留在 `pattern/*`
- [Risk] 没有静态校验时，pattern 仍然依赖 Agent 自觉执行 -> Mitigation: 先把学习入口、计划步骤和自检步骤都写成硬性 workflow；后续再视稳定性决定是否追加自动化检查

## Migration Plan

1. 更新 `raven-learn`，使其在学习 core 或 RavenJS 业务代码任务时显式读取 pattern 入口和相关子文档
2. 更新 `raven-use`，在“学习完成”与“写代码”之间新增 Pattern Plan 步骤
3. 在 `raven-use` 或相关技能中增加基于 `anti-patterns.md` 的收尾自检要求
4. 更新 `modules/core/GUIDE.md` 与必要的 README 文案，使 Agent 能从入口文档直接分流到 pattern 文档
5. 以文档示例或技能措辞验证常见任务：简单写接口、可复用写流程、复杂查询、runtime assembly

本次变更不涉及运行时 API 或数据迁移。已有项目无需迁移代码；重新安装或更新技能后即可获得新的 Agent 工作流约束。

## Open Questions

- Pattern Plan 是否只要求 Agent 内部完成，还是需要在和用户的沟通中显式展示一个简短摘要？
- 后续是否需要把部分 anti-pattern 检查沉淀成自动化 review 规则，还是继续保持为技能层的自检？
