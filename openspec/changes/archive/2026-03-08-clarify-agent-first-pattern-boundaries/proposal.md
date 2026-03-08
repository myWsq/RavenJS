## Why

当前 RavenJS pattern 文档虽然强调 `Entity` 承载业务规则，但对 `validation` 的表述仍然过宽，容易让 Agent 把业务校验分散写进 `body schema`、handler 或 entity 的多个入口里。由于 `withSchema()` 与 Standard Schema 同时支持校验、转换与整形，如果不把边界写得更精确，Agent 会自然地把“结构校验”和“业务规则”混在一起。

这次变更要把 pattern 明确成一个 Agent-first 的决策系统：Agent 读完文档后，应能直接判断什么属于 transport validation，什么属于 domain invariants，以及为什么所有业务逻辑都应收敛到 entity。

## What Changes

- 明确 RavenJS pattern 中三类约束的边界：`transport validation`、`domain invariants`、`persistence constraints`。
- 更新 `modules/core/pattern/overview.md` 与 `layer-responsibilities.md`，把 `Interface Unit` 的 `validation` 改写为仅负责 transport validation，并明确 `Entity` 是业务规则与状态迁移的唯一归属。
- 更新 `modules/core/pattern/anti-patterns.md`，新增“在 request schema 中编码业务规则”的反模式，并给出 Agent 可执行的识别标准。
- 调整 pattern 示例与表述，避免把 `schema` 的 `refine`、`transform`、隐式查询等能力误示范为业务规则承载点。
- 强化 Agent-first 写法：文档要优先服务 Agent 的判断与生成，而不是仅做面向人类的概念说明。

## Capabilities

### New Capabilities

- `pattern-business-boundaries`: 定义 RavenJS pattern 文档中 transport validation、domain invariants 与 persistence constraints 的职责边界，并要求业务规则收敛到 entity。

### Modified Capabilities

- `pattern-guided-skills`: 技能在指导 Agent 使用 pattern 时，需要显式应用新的边界语言，避免把 request schema 当作业务规则载体。

## Impact

- 影响 `modules/core/pattern/overview.md`、`modules/core/pattern/layer-responsibilities.md`、`modules/core/pattern/anti-patterns.md` 等 pattern 文档。
- 影响 RavenJS Agent 技能对 pattern 的读取与执行口径，尤其是 `raven-learn`、`raven-use` 一类面向业务代码任务的技能提示。
- 影响后续 review 标准：业务规则放置位置将从“风格建议”升级为 pattern 的显式判定规则。
