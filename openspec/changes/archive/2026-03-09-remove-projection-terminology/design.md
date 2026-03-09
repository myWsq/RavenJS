## Context

当前活跃规范已经把 RavenJS 的业务代码 pattern 组织成一套 Agent-first 的学习与执行路径，但其中仍保留了 `Projection` 这一层级术语。对人类读者来说，`Projection` 可以被理解为查询结果整形、只读模型或特定的分层约定；但对 Agent 来说，这个词与 `DTO`、查询结果映射、view model 很容易混淆，最终表现为：

- 在简单读路径中平白引入额外层级；
- 把“需要一个返回结构”误判成“必须建立 Projection”；
- 在 `Projection` 与 `DTO` 之间摇摆，导致生成结果不稳定。

这次变更不涉及运行时代码或数据结构迁移，重点是收紧 OpenSpec 契约，让后续文档、技能和实现都使用更稳定的 Agent-facing 语言。

## Goals / Non-Goals

**Goals:**

- 从活跃规范中移除 `Projection` 作为推荐业务结构或扩展层的描述。
- 用 `DTO`、查询结果映射或 `complex read` 等更稳定的语言替换原有 `Projection` 表述。
- 保持 RavenJS 对复杂读路径的表达能力，但避免 Agent 被要求区分 `Projection` 与 `DTO` 的边界。
- 让 `pattern-guided-skills` 与 `core-learning-structure` 的口径一致，为后续文档实现提供清晰方向。

**Non-Goals:**

- 不修改任何运行时代码、Schema 行为或数据访问实现。
- 不在本次变更中重新设计 `Command`、`Query`、`DTO` 的整体架构。
- 不要求改写 archived change 中的历史文档；本次以活跃规范和后续实现入口为准。
- 不禁止实现层做查询结果整形；仅禁止把 `Projection` 继续当作 Agent 默认要学习和输出的一等层。

## Decisions

### 1. 从 Agent-facing 规范中移除 `Projection` 术语

`Projection` 将不再出现在活跃规范的推荐业务结构列表、Pattern Plan 扩展层描述和 GUIDE/README 分流术语中。这样做的原因是该概念对 Agent 不够稳定，容易被误用成“每个读路径都需要的额外层”。

备选方案是保留 `Projection`，但在文档中额外解释它与 `DTO` 的差异。这个方案被放弃，因为它提高了术语教学成本，却不能保证 Agent 真正稳定执行。

### 2. 用 `DTO` / 查询结果映射替换复杂读路径表述

对于原本写成 `Query + Projection` 的位置，统一改写为 `Query + DTO`、查询结果映射或更中性的 `complex read` 描述。这样仍然保留“复杂读路径需要显式建模”的能力，但不强制 Agent 学习一个模糊的新名词。

备选方案是只删除 `Projection`，不提供替代表达。这个方案会让复杂读路径的扩展点变得过于抽象，因此需要保留可执行的替代语言。

### 3. 将问题定义为文档契约收缩，而不是架构扩张

这次设计把问题视为 Agent 契约的去歧义，而不是补充更多分层说明。规范将明确要求技能和学习入口不再把 `Projection` 当作默认推荐层，但不会新增新的中间层或复杂规则。

备选方案是新增专门 requirement 解释读模型分层。这个方向超出了本次“去除歧义”的范围，也会增加 Agent 负担，因此不采用。

### 4. 仅修改活跃 capability，避免污染历史归档

本次 change 只对 `pattern-guided-skills` 和 `core-learning-structure` 的活跃 spec 产生 delta。历史 archive 保持不动，后续实现阶段再根据这些 delta 去更新实际文档和技能内容。

备选方案是同步修改 archive 中的历史提案或 spec 副本。由于 archive 只承载历史记录，不参与当前契约判断，因此没有必要。

## Risks / Trade-offs

- [复杂读路径表达变弱] -> 通过保留 `Query`、`DTO` 与“查询结果映射”的说法，避免从一个模糊术语退化成完全无结构。
- [团队成员对 `Projection` 仍有既有习惯] -> 在 spec 中把禁用范围限定为 Agent-facing 学习与输出语言，而不是否定所有架构讨论场景。
- [活跃 spec 与实现文档暂时不同步] -> 通过 tasks 明确要求后续同步更新 `modules/core/GUIDE.md`、`README.md`、pattern 文档与技能说明。
- [替代术语再次膨胀] -> 使用最少必要术语，只保留 `DTO`、查询结果映射和 `complex read`，避免再引入新的近义层。

## Migration Plan

1. 修改活跃 OpenSpec capability，移除 `Projection` 的规范性描述。
2. 在实现阶段同步更新 `modules/core/GUIDE.md`、`modules/core/README.md`、`modules/core/pattern/*` 以及相关技能文案。
3. 在文档自检时确认活跃入口不再要求 Agent 区分 `Projection` 与 `DTO`。
4. 若后续发现某处仍需要表达复杂读模型，优先使用 `DTO` 或“查询结果映射”语言，而不是恢复 `Projection`。

## Open Questions

- `modules/core/pattern/*` 中是否存在少量需要从“Projection”重命名为“DTO”的示例标题，需要在实现阶段统一搜一遍确认。
- 对于少数已经习惯 CQRS 术语的内部说明，是否需要保留“曾使用 Projection，现统一改称查询结果映射”的过渡说明。
