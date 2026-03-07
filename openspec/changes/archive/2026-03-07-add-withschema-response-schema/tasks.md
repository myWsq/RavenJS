## 1. 类型与校验模型

- [x] 1.1 扩展 `modules/core/schema/with-schema.ts` 的 `Schemas`、`SchemaAwareHandler` 与 `withSchema` 类型重载，支持可选 `response` schema，并在声明后把业务 handler 返回类型切换为 response schema 的输入类型
- [x] 1.2 扩展 `modules/core/schema/validation.ts` 的校验辅助逻辑与 `ValidationError`，支持 response schema 校验结果与 `responseIssues`

## 2. Core 运行时接入

- [x] 2.1 调整 schema-aware route wrapper 的执行逻辑，在保留现有请求 schema 流程的前提下，对声明了 `response` schema 的 handler 返回值执行校验/转换；当 mismatch 时触发专用 hook 并回退为原始 `Response.json(...)`
- [x] 2.2 保持未声明 `response` schema 的现有 `Response` 返回链路不变，并确认 `dispatchRequest` / `beforeResponse` 仍然只处理最终 `Response`

## 3. 测试与文档

- [x] 3.1 为 `withSchema` 增加单元测试，覆盖 response schema 成功序列化、mismatch 触发专用 hook 并回退、以及无 response schema 的兼容路径
- [x] 3.2 更新 `modules/core/README.md`、相关 guide/docs 示例，说明 `response` schema 的声明方式、默认 JSON 响应行为，以及 `responseIssues` / 专用 hook 的观测语义
