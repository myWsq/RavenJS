## 1. 更新活跃规范

- [x] 1.1 更新 `openspec/specs/pattern-guided-skills/spec.md`，移除业务代码任务与 Pattern Plan 中对 `Projection` 的规范性描述
- [x] 1.2 更新 `openspec/specs/core-learning-structure/spec.md`，将 GUIDE / README 的业务结构分流术语改为 `DTO` 或查询结果映射

## 2. 同步 Agent 入口文档

- [x] 2.1 更新 `modules/core/GUIDE.md` 与 `modules/core/README.md`，移除把 `Projection` 当作推荐业务结构的表述
- [x] 2.2 更新 `modules/core/pattern/*` 中面向 Agent 的相关说明，统一改用 `DTO`、查询结果映射或 `complex read` 语言
- [x] 2.3 更新相关技能说明或提示文案，避免继续把 `Query + Projection` 作为默认复杂读路径模板

## 3. 验证术语收口

- [x] 3.1 搜索活跃规范、活跃文档与技能说明中的 `Projection` / `projection`，确认不再作为 Agent-facing 推荐术语存在
- [x] 3.2 复查复杂读路径示例，确认仍保留清晰的 `Query`、`DTO` 或查询结果映射扩展点，而没有退化成含糊表述
