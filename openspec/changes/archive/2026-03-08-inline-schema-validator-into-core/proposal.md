## Why

当前 `schema-validator` 以独立模块存在，但其运行时行为完全依赖 `@raven.js/core` 已经写入的 `BodyState`、`QueryState`、`ParamsState` 和 `HeadersState`。这种拆分让校验能力在使用、文档、模块分发和 CLI 安装层面都被人为割裂，增加了认知成本；既然这次明确不考虑兼容性，就应直接把 Standard Schema 校验能力收回 core，消除重复边界。

## What Changes

- **BREAKING** 将 `withSchema`、`ValidationError`、`isValidationError`、`SchemaClass` 及其 Standard Schema 类型定义内置到 `@raven.js/core`。
- **BREAKING** 重构 core 的 handler/schema 执行模型，使路由可直接使用带 schema 的 handler，而不是依赖 `@raven.js/schema-validator` 包装后再接入。
- **BREAKING** 删除独立的 `modules/schema-validator` 模块，不再作为可安装模块、文档入口或 CLI registry 项存在。
- 修改 core 文档与示例，统一以 core 作为请求数据校验入口，明确 body/query/params/headers 的 schema 校验与错误抛出行为。
- 同步更新 README、模块清单、测试和相关脚本，移除对 `schema-validator` 作为单独模块的描述与验证。

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `validator`: 将校验能力从“core 不做 schema 校验、validator 独立提供”改为“core 内建 Standard Schema 校验、typed context 与校验错误模型”。
- `core-framework`: 扩展核心框架的 handler 执行能力，使 core 直接承载 schema 驱动的请求校验与类型化处理流程。

## Impact

- 受影响代码：`modules/core/`、`modules/schema-validator/`、CLI registry 生成逻辑、README 和相关文档、单元测试与 E2E 测试。
- 受影响 API：校验相关导出从 `@raven.js/schema-validator` 迁移到 `@raven.js/core`；独立模块安装入口移除。
- 受影响分发：CLI 可安装模块列表和嵌入源码将不再包含 `schema-validator`。
