## Why

目前的 `scoped-token` 仅限于请求生命周期，无法优雅地在插件之间共享全局资源（如数据库连接、配置）。同时命名过于局限，需要一个更通用、支持多层次作用域的状态管理机制。此外，当前的实现将声明与赋值耦合在一起，不利于复杂的依赖注入场景，需要一种更简洁、基于上下文感知的状态管理方式。

## What Changes

- **BREAKING**: 将 `ScopedToken` 重构为抽象类 `ScopedState`。
- **BREAKING**: 原 `ScopedToken` 逻辑迁移至 `RequestState` 子类。
- 新增 `AppState` 子类，用于管理应用级别的全局（Raven 实例级）状态。
- `ScopedState.set(value)` 负责在当前作用域内填充值。对于 `AppState`，它会自动关联到当前的 `Raven` 实例；对于 `RequestState`，它会关联到当前请求。
- 实现基于异步上下文（AsyncLocalStorage）的自动作用域感知，使得 `State.get()` 和 `State.set()` 能够自动定位到当前的 `Raven` 实例或请求上下文，无需显式传递实例或调用挂载方法。

## Capabilities

### New Capabilities

- `state-management`: 统一的应用与请求级状态管理系统，支持基于上下文的自动作用域感知。

### Modified Capabilities

- `scoped-token`: 升级为 `ScopedState` 体系，增强作用域支持和生命周期管理。

## Impact

- `packages/core/utils/state.ts`: 新增文件，替代并删除 `packages/core/utils/scoped-token.ts`。
- `packages/core/main.ts`:
  - 在插件注册、Group 处理和请求处理中维护 `Raven` 实例的异步上下文。
  - 更新 `RavenContext` 的定义为 `RequestState`。
- `packages/core/utils/error.ts`: 更新相关的错误代码定义。
- `packages/core/tests/`: 更新所有涉及 token 的单元测试和集成测试。
