## Why

现有插件/状态系统要求 State 必须在 Plugin 工厂函数的闭包内创建，导致无法跨模块静态 import、存在循环引用，且同一 Plugin 注册多次时状态隔离的理解成本极高。本次重构以"静态声明、显式 Scope、Setter 注入"替代现有闭包模式，彻底解决上述问题。

## What Changes

- **BREAKING** `ScopedState` 移除 `set()` 方法——State 对消费者完全只读
- **BREAKING** `ScopedState` 新增 `in(scopeKey)` 方法，返回绑定到指定 Scope 的视图（同 key 调用结果引用相等）
- **BREAKING** `Plugin` 接口移除 `states` 字段及泛型；`load()` 新增第二个参数 `set: StateSetter`，作为唯一合法的 State 写入途径
- **BREAKING** `register()` 签名改为 `register(plugin, scopeKey?): Promise<void>`，不再返回 states 元组
- **BREAKING** `Raven.internalStateMap` 替换为 `Raven.scopedStateMaps: Map<ScopeKey, Map<symbol, any>>`
- **BREAKING** `requestStorage` 从 `AsyncLocalStorage<Map<symbol, any>>` 改为 `AsyncLocalStorage<Map<ScopeKey, Map<symbol, any>>>`
- **BREAKING** `definePlugin` 移除泛型，改为接收 `Plugin` 对象的 identity 辅助函数
- 新增 `StateSetter = <T>(state: ScopedState<T>, value: T) => void` 类型
- 框架内部（`processStates` 等）通过 module 内私有 `internalSetter` 写入 GLOBAL scope，不暴露给用户

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `plugin-system`：Plugin 接口彻底变更（移除 `states`/泛型，`load` 新增 `set` 参数）；`register()` 新增 `scopeKey` 参数，返回值改为 `Promise<void>`；`definePlugin` 简化
- `core-framework`：`ScopedState` 新增 `in()` / 移除 `set()`；两层 Map 存储结构（AppState 与 RequestState 均支持 Scope）；新增 `StateSetter` 类型与 GLOBAL_SCOPE 常量

## Impact

- `modules/core/index.ts`：主要改动集中于此，涉及 `ScopedState`、`AppState`、`RequestState`、`Raven`、`register()`、`definePlugin`、`processStates` 所有相关路径
- `tests/unit/core/state.test.ts`：State 读写测试需全面更新（`set()` 不再存在）
- `tests/unit/core/plugin.test.ts`：Plugin 注册测试需全面更新（`states` 字段移除，`load` 签名变更）
- 破坏性变更，无需向后兼容（当前无外部用户）
