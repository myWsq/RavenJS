## 1. 更新 Pattern 文档目录约定

- [x] 1.1 修改 `modules/core/pattern/conventions.md`，将目录树根从固定 `src/` 改为 `<app_root>`，并把 `app.ts`、`plugins/`、`scopes.ts` 从 `<app_root>/raven/` 平铺到 `<app_root>/`
- [x] 1.2 修改 `modules/core/pattern/conventions.md` 中的命名规则与固定入口说明，统一使用 `<app_root>/app.ts` 和 `<app_root>/infra/...`
- [x] 1.3 修改 `modules/core/pattern/runtime-assembly.md` 中所有 `src/raven/app.ts` 相关表述与示例代码周边说明，统一改为 `<app_root>/app.ts`

## 2. 清理关联文档并完成校验

- [x] 2.1 检查 `modules/core/pattern/overview.md`、`modules/core/pattern/layer-responsibilities.md` 及学习入口文档，确保不存在与新目录约定冲突的路径措辞
- [x] 2.2 全仓搜索 `src/raven`、`raven/app.ts` 与旧的嵌套 runtime assembly 表述，清理仍作为推荐路径出现的残留引用
- [x] 2.3 对照 `pattern-directory-structure` 与 `core-learning-structure` spec 自检，确认文档已明确 `<app_root>` 的含义，并且 runtime assembly 不再被描述为固定位于 `src/raven/`
