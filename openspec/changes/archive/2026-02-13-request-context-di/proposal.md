## Why

目前框架缺乏在异步操作中追踪和访问请求级上下文的能力。为了支持高度可扩展的依赖注入和模块化能力，我们需要一个**统一的、可扩展的异步上下文存储机制**。与其为每个功能创建独立的 `AsyncLocalStorage`，不如使用单一的存储池，并允许不同模块安全地注册和访问自己的变量。

## What Changes

- 在框架内部维护唯一的 `AsyncLocalStorage<Map<symbol, any>>` 存储。
- 提供 `runScoped(callback)` 函数，用于启动一个新的、统一的异步作用域。
- 提供 `createScopedToken<T>(name: string)` 工厂函数，用于创建作用域内的变量令牌。
- 将框架核心的 `Context` 对象声明为 `ScopedToken<Context>`，使其在异步作用域内全局可访问。
- 在框架请求生命周期中自动通过 `runScoped` 初始化作用域并注入 `Context`。

## Capabilities

### New Capabilities

- `scoped-tokens`: 提供统一的、基于令牌的异步作用域变量管理机制。

### Modified Capabilities

- `lifecycle-hooks`: 集成 `runScoped` 以覆盖请求全生命周期。

### Modified Capabilities

- `request-context`: 不再作为独立的存储类，而是作为 `unified-async-context` 的一个预定义 Token。
- `lifecycle-hooks`: 修改为在请求入口处启动统一的上下文池。

## Impact

- `packages/main/index.ts`: 修改请求处理流程以注入上下文。
- 新增 `packages/main/src/context/`: 存放上下文相关的实现。
- 开发者可以直接通过静态类获取请求信息，无需在函数签名中透传。
