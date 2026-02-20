## Why

当前 `ErrorContext` 接口包含 `status` 属性用于表示 HTTP 状态码，这导致状态码信息与通用上下文混合。将 `statusCode` 提升为 `RavenError` 的一级属性可以更清晰地表达语义，便于类型检查和错误响应构建。

## What Changes

- **BREAKING**: 从 `ErrorContext` 接口移除 `status` 属性
- 为 `RavenError` 类添加 `statusCode` 属性（可选，默认 500）
- 更新 `RavenError.toResponse()` 方法使用新的 `statusCode` 属性
- 更新 `ERR_VALIDATION` 等工厂方法以设置 `statusCode`

## Capabilities

### New Capabilities

（无新能力）

### Modified Capabilities

- `error-handling`: 修改 RavenError 的结构，将 HTTP 状态码从 context 移至类属性

## Impact

- `packages/core/utils/error.ts`: RavenError 类和 ErrorContext 接口变更
- 所有依赖 `context.status` 的代码需要迁移到 `error.statusCode`
- 对外 API 破坏性变更，需要更新文档
