## Why

基准测试显示 AJV 的 JTD Parser 在 Bun 运行时下比 `JSON.parse + validate` 组合慢 3.8-3.9 倍。当前 `bodySchema()` 使用 `compileParser()` 而非 `compile()`，不仅性能差，还与 query/params/headers 的验证模式不一致。

## What Changes

- **BREAKING**: 移除 `JTDParser` 类型和 `bodyParser` 属性
- 将 `bodySchema()` 改为使用 `ajv.compile()` 生成 `ValidateFunction`
- body 解析改用原生 `request.json()` + validator 验证
- 统一所有 schema 验证使用 `ValidateFunction` 模式

## Capabilities

### New Capabilities

(无新增能力)

### Modified Capabilities

- `handler-schema-validation`: body 验证从 JTD Parser 改为 JSON.parse + ValidateFunction 模式

## Impact

- **packages/core/main.ts**: 修改 `Handler` 类型、`HandlerBuilder` 类、请求处理逻辑
- **API 变更**: `Handler.bodyParser` 移除，替换为 `Handler.bodyValidator`
- **性能**: body 验证性能提升约 4 倍
- **依赖**: 移除 `JTDParser` 类型导入
