## ADDED Requirements

### Requirement: Scope-pinned State View via `in()`

`ScopedState<T>` SHALL 提供 `in(scopeKey: string | symbol): ScopedState<T>` 方法，返回一个绑定到指定 Scope 的视图对象。视图对象提供与 `ScopedState` 相同的 `get()` 和 `getOrFailed()` 接口，但始终从指定 Scope 读取数据，不依赖任何隐式上下文。

同一 `ScopedState` 实例以相同 `scopeKey` 多次调用 `in()` MUST 返回同一对象（引用相等）。

在视图对象上再次调用 `in(otherKey)` SHALL 等价于在原始 State 上调用 `in(otherKey)`，即 `State.in("S1").in("S2") === State.in("S2")`。

#### Scenario: 读取具名 Scope 的 AppState

- **WHEN** `await app.register(sqlPlugin, 'S1')` 完成后，在任意上下文调用 `DBState.in('S1').get()`
- **THEN** SHALL 返回 `sqlPlugin` 在 `'S1'` Scope 下写入的值

#### Scenario: 读取具名 Scope 的 RequestState

- **WHEN** `await app.register(sqlPlugin, 'S1')` 完成后，在请求处理上下文调用 `TxState.in('S1').get()`
- **THEN** SHALL 返回该请求中 `sqlPlugin@S1` 的 hook 通过 setter 写入的值

#### Scenario: in() 引用相等性

- **WHEN** 对同一 State 实例以相同 key 两次调用 `in()`
- **THEN** `DBState.in('S1') === DBState.in('S1')` MUST 为 `true`

#### Scenario: in() 链式重置 Scope

- **WHEN** 调用 `DBState.in('S1').in('S2')`
- **THEN** 返回值 MUST 与 `DBState.in('S2')` 引用相等

---

### Requirement: StateSetter 作为唯一写入途径

`ScopedState` 子类 SHALL 不再对外暴露 `set()` 方法。State 的写入 MUST 通过框架在 `plugin.load()` 第二个参数提供的 `StateSetter` 函数完成。

`StateSetter = <T>(state: ScopedState<T>, value: T) => void` 是一个 scope 绑定函数，持有注册时指定的 scopeKey。无论该函数被传递到何处（包括 hook 闭包），其写入的 Scope 始终固定。

#### Scenario: 通过 setter 写入 AppState

- **WHEN** 在 `load(app, set)` 中调用 `set(DBState, db)`
- **THEN** `DBState` 在当前 Scope 下的值 SHALL 立即为 `db`

#### Scenario: 通过 setter 写入 RequestState（在 hook 中）

- **WHEN** 在 `load(app, set)` 中注册 `app.beforeHandle(() => set(TxState, tx))`，且请求到达
- **THEN** 该请求中 `TxState.in(scopeKey).get()` SHALL 返回 `tx`

#### Scenario: setter 在 hook 闭包中保持 Scope 绑定

- **WHEN** 同一插件注册到 `'S1'` 和 `'S2'` 两个 Scope，各自的 hook 通过对应 setter 写入 `TxState`
- **THEN** `TxState.in('S1').get()` 和 `TxState.in('S2').get()` SHALL 返回各自独立的值

---

### Requirement: Plugin Scope Registration

`Raven.register(plugin, scopeKey?)` 中指定的 `scopeKey` SHALL 决定该次注册的 `StateSetter` 写入哪个 Scope。未指定 `scopeKey` 时，使用框架内部 `GLOBAL_SCOPE`（`Symbol('raven:global')`），对应 `State.get()`（无 `.in()`）的默认读取范围。

#### Scenario: 无 scopeKey 时 setter 写入 GLOBAL Scope

- **WHEN** `await app.register(plugin)`（无 scopeKey），`load` 中调用 `set(DBState, db)`
- **THEN** `DBState.get()` SHALL 返回 `db`

#### Scenario: 有 scopeKey 时 setter 写入具名 Scope

- **WHEN** `await app.register(plugin, 'S1')`，`load` 中调用 `set(DBState, db)`
- **THEN** `DBState.get()` SHALL 返回 `undefined`（global 未写入）
- **AND** `DBState.in('S1').get()` SHALL 返回 `db`

## MODIFIED Requirements

### Requirement: Unified State Access (get/set)

`AppState` 和 `RequestState` SHALL 提供 `get()` 方法，通过异步上下文自动识别当前活跃的 Raven 实例（AppState）或请求（RequestState）。`get()` 始终从 GLOBAL_SCOPE 读取，等价于 `State.in(GLOBAL_SCOPE).get()`。`set(value)` 方法 SHALL 从 `ScopedState` 公共接口中移除；写入必须通过 `StateSetter` 完成。

#### Scenario: Context-aware get（GLOBAL Scope）

- **WHEN** `AppState.get()` 在活跃的 Raven 实例上下文中调用
- **THEN** SHALL 返回该实例 GLOBAL Scope 下为该 State 设置的值

#### Scenario: RequestState context-aware get（GLOBAL Scope）

- **WHEN** `RequestState.get()` 在活跃的请求上下文中调用
- **THEN** SHALL 返回当前请求 GLOBAL Scope 下为该 State 设置的值

---

### Requirement: App-level State Management

系统 SHALL 提供 `AppState<T>` 类用于管理应用（Raven 实例）级别的状态。`AppState` 的存储结构为 `Map<ScopeKey, Map<symbol, any>>`（双层 Map），不同 Scope 下的同一 `AppState` 实例持有独立的值。

#### Scenario: AppState Scope isolation

- **WHEN** 同一 `AppState` 实例在 `'S1'` 和 `'S2'` 两个 Scope 下分别被 setter 写入不同值
- **THEN** `AppState.in('S1').get()` 和 `AppState.in('S2').get()` SHALL 各自返回对应 Scope 的值

#### Scenario: AppState isolation between Raven instances

- **WHEN** 同一 `AppState` 在两个不同 Raven 实例各自的 GLOBAL Scope 下写入不同值
- **THEN** 两个实例的 `AppState.get()` SHALL 各自返回对应实例的值，互不影响

---

### Requirement: Request-level State Management

系统 SHALL 提供 `RequestState<T>` 类用于管理单次 HTTP 请求级别的状态。`RequestState` 的请求级存储结构为 `Map<ScopeKey, Map<symbol, any>>`（双层 Map），同一请求内不同 Scope 下的同一 `RequestState` 持有独立的值，不同请求之间完全隔离。

#### Scenario: RequestState Scope isolation within a request

- **WHEN** 同一请求中，`'S1'` Scope 的 hook 和 `'S2'` Scope 的 hook 分别写入同一 `RequestState`
- **THEN** `RequestState.in('S1').get()` 和 `RequestState.in('S2').get()` SHALL 各自返回对应 Scope 的值

#### Scenario: RequestState isolation between concurrent requests

- **WHEN** 多个并发请求同时通过各自的 setter 写入同一 `RequestState`（相同 Scope）
- **THEN** 每个请求的 `RequestState.get()` SHALL 仅返回自身请求内写入的值
