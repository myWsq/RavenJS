## Why

当前 RavenJS 的 pattern 与学习入口文档仍把 `Projection` 作为推荐术语和扩展层的一部分，但对 Agent 来说，`Projection` 与 `DTO` 的边界并不稳定，容易把“查询结果整形”“只读数据结构”“分层建模”混成一个概念。继续保留这套表述，会让 Agent 在设计读路径时引入不必要的抽象，并降低文档的可执行性。

这次变更要把规范中的语言收紧到 Agent 更容易稳定执行的边界：保留 `Command`、`Query`、`DTO`、查询结果映射等必要概念，但移除 `Projection` 作为独立推荐层的描述，避免它继续成为歧义来源。

## What Changes

- 更新 `pattern-guided-skills` 规范，移除业务代码任务、Pattern Plan 与扩展层选择中对 `Projection` 的显式要求。
- 更新 `core-learning-structure` 规范，移除 GUIDE / README 分流场景中把 `projection` 作为推荐业务结构的描述。
- 统一将相关表达改写为 `DTO`、查询结果映射或复杂读路径，避免 Agent 把 `Projection` 误判成必须单独建模的层。
- 要求后续 pattern 文档与技能说明不再把 `Query + Projection` 作为默认扩展模板，而改为更中性的读路径组织语言。

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `pattern-guided-skills`: 技能对业务代码任务的 pattern 引导不再使用 `Projection` 术语，并移除把 `Query + Projection` 作为默认复杂读路径扩展点的要求。
- `core-learning-structure`: core 的 GUIDE / README 学习分流不再把 `projection` 列为推荐业务结构术语，相关学习路径改为使用 `DTO` 或查询结果映射语言。

## Impact

- 影响 `openspec/specs/pattern-guided-skills/spec.md` 与 `openspec/specs/core-learning-structure/spec.md` 的 requirement 与 scenario 表述。
- 影响后续实现阶段对 `modules/core/GUIDE.md`、`modules/core/README.md`、`modules/core/pattern/*` 以及相关技能文案的更新方向。
- 影响 Agent 在 RavenJS 读路径建模时的默认决策，减少因 `Projection` / `DTO` 混淆带来的过度设计。
