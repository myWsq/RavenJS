## 1. 更新 Pattern 文档中的 State 边界

- [x] 1.1 修改 `modules/core/pattern/overview.md`、`layer-responsibilities.md`、`runtime-assembly.md`，系统定义 `Object Style Service`，并说明独立函数如何按需读取 ScopedState
- [x] 1.2 修改 `modules/core/pattern/anti-patterns.md` 与 `conventions.md`，将“class + AppState”写成显式坏味道，并补充 `Object Style Service` 的命名与 object-export 规则
- [x] 1.3 明确 `Repository` 是一种 `Object Style Service`，而不是继续使用“参考 Repository”式的间接措辞

## 2. 更新 RavenJS 技能约束

- [x] 2.1 修改 `packages/install-raven/skills/raven-use/SKILL.md`，要求 Agent 在 Pattern Plan 中先判断依赖应落到 runtime state 还是 `Object Style Service`
- [x] 2.2 修改 `packages/install-raven/skills/raven-learn/SKILL.md` 及相关技能入口，确保学习路径会加载 `Object Style Service` 规则，而不是默认走 class + `AppState`

## 3. 完成一致性校验

- [x] 3.1 全仓搜索与 `Object Style Service`、`Repository`、`AppState` 相关的 pattern/skill 表述，清理旧的“参考 Repository”式措辞
- [x] 3.2 对照 `pattern-object-style-service` 与 `pattern-guided-skills` spec 自检，确认文档同时给出了“何时用 Object Style Service”与“何时必须用 state”的判断
