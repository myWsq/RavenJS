## Why

当前 `withSchema` 只负责请求侧的 body/query/params/headers 校验与类型推断，业务 handler 仍然需要手动构造 `Response`，并在需要响应 DTO 校验或类型收敛时手动调用 `Response.json(...)` 与 schema 解析。这让请求 schema 与响应 schema 的声明分离，重复了样板代码，也削弱了 `withSchema` 作为接口声明入口的完整性。

## What Changes

- 扩展 `withSchema` 的 `schemas` 配置，新增可选的 `response` schema。
- 当定义了 `response` schema 时，schema-aware handler 的返回值类型改为该 response schema 的输入类型，而不是 `Response`。
- core 在执行带 `response` schema 的 schema-aware handler 后，先对返回值执行 response schema 校验/转换，再统一包装为 `Response.json(...)` 返回。
- 未定义 `response` schema 时保持现状，schema-aware handler 仍返回 `Response`，现有路由行为不变。
- 更新 core 文档、示例和测试，明确“请求 schema 负责输入校验，response schema 负责输出 DTO 校验与 JSON 响应封装”的新模式。

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `validator`: 扩展 `withSchema` 的 schema 声明与类型推断规则，使其支持 `response` schema，并在定义后将 handler 返回值约束为 response schema 的输入类型。
- `core-framework`: 扩展 schema-aware handler 的执行流程，使 core 能在 handler 返回 DTO 后完成 response schema 校验/转换，并自动生成 JSON `Response`。

## Impact

- 受影响代码：`modules/core/schema/with-schema.ts`、`modules/core/schema/validation.ts`、`modules/core/app/raven.ts`、`modules/core/runtime/dispatch-request.ts` 及相关类型定义。
- 受影响 API：`withSchema` 的 `schemas` 配置新增 `response` 字段；带 `response` schema 的 handler 返回签名发生变化。
- 受影响文档与测试：`modules/core/README.md`、可能的 guide/docs 示例，以及 `tests/unit/core/schema/validation.test.ts` 等 schema 相关测试。
