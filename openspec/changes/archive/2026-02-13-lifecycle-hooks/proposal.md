## Why

为 Raven 框架引入声明周期的钩子（Hooks）能力，使用户能够在请求处理的不同阶段注入自定义逻辑（如身份验证、日志记录、响应转换等）。同时，通过统一的错误处理机制，提高框架的健壮性和易用性。

## What Changes

- **钩子注册机制**：在 `Raven` 类中添加注册生命周期钩子的方法，包括 `onRequest`、`beforeHandle`、`beforeResponse` 和 `onError`。
- **请求处理流调整**：重构请求处理管道，按照 `onRequest -> beforeHandle -> (Handler) -> beforeResponse` 的顺序执行钩子。
- **全局错误捕获**：确保请求生命周期中的任何阶段报错都会被捕获并传递给 `onError` 钩子处理。
- **参数与返回值类型化**：为不同阶段的钩子定义专门的输入参数和返回类型，以支持灵活的请求/响应操纵。

## Capabilities

### New Capabilities

- `lifecycle-hooks`: 定义和执行请求生命周期的各个阶段（onRequest, beforeHandle, beforeResponse）。
- `error-handling`: 提供全局 `onError` 钩子，用于捕获和处理整个生命周期中的异常。

### Modified Capabilities

- `http-server`: 调整请求处理逻辑以集成生命周期钩子执行链。

## Impact

- `packages/main/index.ts`: `Raven` 类将增加钩子存储和执行逻辑，`handleRequest` 方法将被重构以支持异步钩子链。
