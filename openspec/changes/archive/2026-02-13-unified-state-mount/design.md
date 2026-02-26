## Context

RavenJS 目前的 `scoped-token` 机制仅支持请求级（Request-scoped）的状态存储，且声明与赋值高度耦合。随着插件系统的复杂化，开发者需要在插件间共享全局资源（如数据库连接、配置等），这要求一套更通用的、支持多层次作用域的状态管理系统。

## Goals / Non-Goals

**Goals:**

- 将 `ScopedToken` 升级为支持应用级（AppState）和请求级（RequestState）的统一体系。
- 实现“环境感知”的 `get()` 和 `set()`，无需显式传递上下文对象或调用 `mount`。
- 简化 API，通过 `set()` 直接在当前活跃作用域（App 或 Request）中存储值。
- 提供更优雅的错误处理，`get()` 在无上下文时返回 `undefined`。

**Non-Goals:**

- 不支持跨进程的状态共享。
- 不提供状态的响应式（Reactive）监听机制。

## Decisions

### 1. 基于 AsyncLocalStorage 的双重上下文追踪

为了实现 `get()` 和 `set()` 的无参数调用，设计两个轻量级的 `AsyncLocalStorage` (ALS) 实例：

- `currentAppStorage`: 追踪当前活跃的 `Raven` 实例（用于 `AppState`）。
- `requestStorage`: 追踪当前请求的 `Map<symbol, any>`（用于 `RequestState`）。

### 2. 类层级结构与职责

- **`ScopedState<T>` (Abstract)**: 存储 Symbol 和名称。
  - `get()`: 抽象方法，尝试获取当前作用域的值。
  - `getOrFailed()`: 封装好的方法，若 `get()` 返回 `undefined` 则抛出 `RavenError`。
  - `set(value: T)`: 抽象方法，将值设置到当前作用域。
- **`AppState<T>`**:
  - `set()` 通过 `currentAppStorage` 找到当前的 `Raven` 实例，并存入其 `internalStateMap`。
  - `get()` 支持作用域穿透：如果在当前 `Raven` 实例没找到，会递归向上查找 `parent` 实例。
- **`RequestState<T>`**:
  - `set()` 存入 `requestStorage` 提供的 Map。
  - `get()` 从 `requestStorage` 获取。

### 3. Raven 实例作为状态容器

- 在 `Raven` 类中增加 `private internalStateMap = new Map<symbol, any>()`。
- 重构 `handleRequest`、`register`、`group` 等方法，确保它们在对应的 `currentAppStorage.run()` 中执行。

### 4. 彻底简化 API

取消所有显式的挂载（Mounting）步骤。

- 开发者只需通过 `AppState` 或 `RequestState` 的实例调用 `set(value)`，框架会根据当前的 ALS 环境自动将值存储在正确的位置（对应的 Raven 实例或请求作用域）。
- 这种“随用随设”的模式降低了插件开发的门槛。

## Risks / Trade-offs

- **[Risk] 异步上下文丢失** → **[Mitigation]** 必须确保所有生命周期钩子和外部入口（如第三方适配器）都被包装在 ALS 的 `run` 中。
- **[Trade-off] 作用域嵌套的复杂性** → 在嵌套的 `group()` 中调用 `AppState.set()` 会将值存储在该子实例中，这有助于实现资源隔离，但也需要开发者理解实例树结构。
- **[Performance] ALS 带来的开销** → ALS 在现代 Node.js/Bun 环境下性能损耗极低。
