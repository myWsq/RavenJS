## Context

当前 pattern 已经表达了 `Entity` 承载业务规则、handler 应该保持 business-light，但关键术语 `validation` 仍然把结构校验与业务约束混在一起。对 Agent 来说，这种表述不够可执行：只要 schema 库支持 `refine()`、`transform()` 或异步校验，Agent 就可能把领域规则提前放进 interface 层。

这不是单纯的措辞问题，而是 Agent 生成代码时的决策入口问题。pattern 的第一用户是 Agent，因此文档必须优先回答“这段逻辑应该放哪一层”，而不是只陈述概念定义。

## Goals / Non-Goals

**Goals:**

- 让 Agent 能稳定区分 transport validation、domain invariants 与 persistence constraints。
- 把“所有业务逻辑收敛到 entity”写成可操作的 pattern 规则，而不是隐含倾向。
- 在 pattern 文档中加入更明确的放置规则、反模式与判定问题，降低 Agent 在 schema/handler/entity 之间摇摆的空间。
- 保持 RavenJS 现有 entity-centric 架构，不引入新的 service 层或替代性抽象。
- 让技能文档能够复用这套边界语言，对 Agent 输出形成一致约束。

**Non-Goals:**

- 不修改 `withSchema()`、Standard Schema 或运行时校验实现本身。
- 不禁止 schema 层做反序列化、基础类型约束、轻量格式约束等 transport 处理。
- 不在本次变更中重新设计 repository、command、query 的整体架构。
- 不把所有跨字段判断一刀切移出 schema；只有具有领域语义的约束才必须进入 entity。

## Decisions

### 1. 用三分法重写“校验”语言

采用以下固定术语：

- `transport validation`：请求来源、字段存在性、基础类型、解析、基础格式约束。
- `domain invariants`：业务语义、状态迁移、跨字段领域约束、实体生命周期规则。
- `persistence constraints`：数据库唯一键、外键、存储层约束。

选择这一方案，是因为它最贴近 Agent 的实际决策流程：先判断输入能否被解析，再判断业务事实是否成立，最后判断是否能被持久化。备选方案是继续沿用泛化的 `validation` 一词，但那会继续放大 schema 库能力和 domain rule 的混淆。

### 2. 明确 Interface 只负责 transport validation

`Interface Unit` 继续拥有 request/response schema、编排与 DTO 映射，但文档会把它的 `validation` 明确收缩为 transport validation。Agent 在 interface 层可以做字段形状定义、query/params/header 解析、基础格式检查，但不得在 request schema 中承载领域规则，也不得通过 schema 访问 repository 或 infra。

备选方案是允许“轻业务规则”留在 schema 中，但这会让 Agent 缺乏稳定标准，最终继续出现规则分散。

### 3. 把 Entity 定义为业务规则唯一归属

文档将显式要求：所有会在 HTTP、queue、cron、script 等多种入口下同样成立的规则，都必须进入 `Entity.create(...)`、entity mutator 或等价的实体行为中。`Command` 只编排，`Repository` 只持久化显式状态，不新增隐藏业务语义。

这里采用“入口无关性”作为 Agent 的判断题：如果规则脱离 HTTP 入口仍然成立，它就是 entity 规则。这个标准比抽象定义更适合 Agent 执行。

### 4. 把 Agent-first 判断语句写进 pattern 文档

相关文档会增加更短、更像决策树的表达，例如：

- schema 检查 shape，不决定 business meaning。
- entity 决定 business meaning，不依赖 transport source。
- repository 保存显式状态，不隐式补齐业务字段。

这样做是为了让 Agent 在快速浏览文档时，优先读到“放哪层”的判定句，而不是长篇背景介绍。

### 5. 用 anti-pattern 固化错误示范

新增或补强反模式“Business Rules in Request Schema”，列出典型坏味道：

- request schema 使用 `refine()`/异步查询表达领域约束；
- handler 依赖 schema 变换后的值跳过 entity 初始化；
- repository `save()` 隐式补齐业务字段，导致 DTO 映射依赖持久化副作用。

备选方案是仅更新正向示例，但没有反模式时，Agent 难以在 review/self-check 阶段识别自己是否越界。

## Risks / Trade-offs

- [边界过严] → 某些“基础格式约束”与“轻领域约束”存在灰区；通过“脱离 HTTP 后是否仍成立”的判断题降低歧义。
- [示例过于保守] → 如果文档过度避免 schema 能力，Agent 可能误以为 schema 不能做任何解析；需要明确保留 parse/coerce/basic format 等 transport 责任。
- [技能与文档口径不同步] → 即使 pattern 文档更新，若技能提示仍旧泛称 `validation`，Agent 仍会回到旧习惯；因此要同步修改 `pattern-guided-skills` 能力说明。
- [规则升级带来存量偏差] → 现有示例或历史代码可能仍混用 schema 与业务规则；本次先更新 pattern 契约，不要求同时清理所有存量实现。

## Open Questions

- `startAt < endAt` 这类跨字段约束，在不同上下文下是否都按 domain invariant 处理，还是允许保留一部分纯 transport 版本示例？
- 是否要在后续变更中给 `modules/core/README.md` 或技能 README 增加一页专门的“Agent 判定速查表”？
