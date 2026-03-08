## 1. Pattern 边界文档

- [x] 1.1 更新 `modules/core/pattern/overview.md`，把 pattern 的第一用户明确为 Agent，并加入 transport/domain/persistence 三分法
- [x] 1.2 更新 `modules/core/pattern/layer-responsibilities.md`，将 interface 的 `validation` 明确收缩为 transport validation，并把 entity 写成业务规则唯一归属
- [x] 1.3 更新 `modules/core/pattern/anti-patterns.md`，新增“在 request schema 中编码业务规则”的反模式与识别标准
- [x] 1.4 审核并调整相关 pattern 示例，避免把 schema 的 `refine`、`transform` 或隐式依赖示范成业务规则承载点

## 2. Agent 指导与一致性

- [x] 2.1 更新相关技能或指导文档，使 Agent 在业务代码任务中显式应用 transport validation 与 domain invariants 的边界语言
- [x] 2.2 检查 `modules/core/README.md`、`GUIDE` 或其他 pattern 入口是否需要补充 Agent-first 的边界提示
- [x] 2.3 进行一次基于 anti-pattern 的文档自检，确认各文档对“业务逻辑收敛到 entity”的口径一致
