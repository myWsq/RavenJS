## Why

当前 pattern 文档把业务代码根目录写死为 `src/`，并将运行时装配入口描述为 `src/raven/app.ts`。这会把“常见目录”误导成“唯一规范”，同时在仓库与示例中制造 `raven/raven` 的双层命名，增加 Agent 和开发者理解目录边界时的混淆。

## What Changes

- 将 pattern 文档中的业务代码根目录从固定的 `src/` 调整为占位符 `<app_root>`，明确它表示“承载 Raven app 全部业务代码的目录”，通常是 `src/`，但不强制限定。
- 将运行时装配目录从 `<app_root>/raven/` 改为直接平铺在 `<app_root>/` 下，使 `app.ts`、`plugins/`、`scopes.ts` 与 `interface/`、`entity/`、`infra/` 等目录处于同一层级。
- 更新 pattern 文档中的目录树、命名规则、运行时装配说明与示例路径，统一使用 `<app_root>/app.ts` 等新路径表述。
- 明确这是文档与 pattern 约定层面的调整，不引入新的运行时能力，也不要求框架强制扫描某个固定目录名。

## Capabilities

### New Capabilities

- `pattern-directory-structure`: 定义 RavenJS pattern 文档中业务代码根目录与运行时装配目录的标准表达方式，避免固定 `src/raven` 路径造成误导。

### Modified Capabilities

- `core-learning-structure`: 学习结构文档引用的 pattern 目录约定需要与新的 `<app_root>` 表达保持一致，确保 Agent 读到的路径术语不再暗示 `src/raven` 是唯一合法结构。

## Impact

- 受影响文档：`modules/core/pattern/conventions.md`、`modules/core/pattern/runtime-assembly.md`，以及任何引用旧路径示例的关联文档。
- 受影响规范：新增 `pattern-directory-structure` spec delta，并更新 `core-learning-structure` 的相关要求。
- 对运行时代码、CLI 行为和公开 API 无直接影响；主要影响 Agent 学习路径、示例一致性和目录命名约定。
