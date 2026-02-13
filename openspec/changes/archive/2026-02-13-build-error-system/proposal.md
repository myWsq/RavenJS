## Why

RavenJS 当前缺乏统一的错误系统，代码中直接使用裸的 `throw new Error` 和硬编码的错误消息。这种做法导致错误难以追踪和诊断。随着框架规模增长，需要标准化的错误处理机制。

## What Changes

- 创建标准化错误类 `RavenError`，支持错误代码、上下文数据
- 实现错误码系统，使用 `ERR_XXX` 格式的字符串错误码
- 每个错误类型对应一个静态方法，如 `RavenError.ERR_SERVER_ALREADY_RUNNING()`
- 提供 `setContext()` 方法用于后续添加上下文
- 废弃代码中直接使用 `throw new Error`，统一使用新的错误系统

## Capabilities

### New Capabilities

- **error-factory**: 提供 `RavenError` 类，包含静态错误创建方法和 `setContext` 实例方法

### Modified Capabilities

- **error-handling**: 扩展现有 `error-handling` spec，要求框架错误使用标准化错误类

## Impact

- 新增/修改 `packages/main/utils/error.ts` 存放错误相关代码
- 需要更新现有使用裸 `Error` 的代码，改用标准化错误类
- 不影响现有 API 契约，保持向后兼容
