## 1. 更新 Pattern 文档中的 State 边界

- [x] 1.1 修改 `modules/core/pattern/runtime-assembly.md`，补充“可复用 helper / service 默认采用 `Repository` 风格 object module，而不是 class + `AppState`”的判定规则与正例
- [x] 1.2 修改 `modules/core/pattern/anti-patterns.md`，将“因单例身份把普通模块升格为 `AppState`”写成显式坏味道，并给出替代方式
- [x] 1.3 检查 `modules/core/pattern/overview.md`、`layer-responsibilities.md`、`conventions.md` 是否需要补一句与新边界一致的引用或术语

## 2. 更新 RavenJS 技能约束

- [x] 2.1 修改 `packages/install-raven/skills/raven-use/SKILL.md`，要求 Agent 在 Pattern Plan 中先判断依赖是否真的需要 runtime state
- [x] 2.2 检查 `packages/install-raven/skills/raven-learn/SKILL.md` 及相关技能入口，确保不会把 helper 默认引导成 class + `AppState`

## 3. 完成一致性校验

- [x] 3.1 全仓搜索与 `AppState`、`Repository`、singleton 相关的 pattern/skill 表述，清理与新规则冲突的推荐措辞
- [x] 3.2 对照 `pattern-runtime-state-guidance` 与 `pattern-guided-skills` spec 自检，确认文档同时给出了“何时不用 state”与“何时必须用 state”的判断
