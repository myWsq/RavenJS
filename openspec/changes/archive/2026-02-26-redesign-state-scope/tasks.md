## 1. 存储结构重构

- [x] 1.1 在 `modules/core/index.ts` 中定义 `GLOBAL_SCOPE = Symbol('raven:global')` 常量（module-level，不导出）
- [x] 1.2 定义 `ScopeKey = string | symbol` 类型别名
- [x] 1.3 在 `RavenInstance` 接口中将 `internalStateMap: Map<symbol, any>` 替换为 `scopedStateMaps: Map<ScopeKey, Map<symbol, any>>`
- [x] 1.4 在 `Raven` 类中将 `internalStateMap` 初始化替换为 `scopedStateMaps`，并提取私有辅助方法 `getOrCreateScopeMap(key: ScopeKey): Map<symbol, any>`
- [x] 1.5 将 `requestStorage` 类型从 `AsyncLocalStorage<Map<symbol, any>>` 改为 `AsyncLocalStorage<Map<ScopeKey, Map<symbol, any>>>`
- [x] 1.6 更新 `Raven.handle()` 中 `requestStorage.run(new Map(), ...)` 的初始值（双层 Map 初始化）

## 2. ScopedState 重构

- [x] 2.1 从 `ScopedState` 抽象类中移除 `abstract set(value: T): void` 声明
- [x] 2.2 在 `ScopedState` 中添加 `private _views = new Map<ScopeKey, ScopedState<T>>()`
- [x] 2.3 在 `ScopedState` 中添加 `public in(scopeKey: ScopeKey): ScopedState<T>` 方法（使用 `_views` 缓存，代理逻辑见 2.6）
- [x] 2.4 在 `ScopedState` 中添加 `protected abstract _createView(scopeKey: ScopeKey): ScopedState<T>` 抽象方法
- [x] 2.5 从 `AppState` 中移除 `public set(value: T)` 方法
- [x] 2.6 新增 `AppStateScopedView<T>` 类：持有 `root: AppState<T>` 和 `scope: ScopeKey`，实现 `get()` 读取 `root` 对应的 `scopedStateMaps[scope]`，`in()` 代理回 `root.in(key)`，`_createView()` 不需要（或 throw）
- [x] 2.7 在 `AppState` 中实现 `_createView(scopeKey)` 返回 `new AppStateScopedView(this, scopeKey)`
- [x] 2.8 更新 `AppState.get()` 读取 `app.scopedStateMaps.get(GLOBAL_SCOPE)?.get(this.symbol)`
- [x] 2.9 从 `RequestState` 中移除 `public set(value: T)` 方法
- [x] 2.10 新增 `RequestStateScopedView<T>` 类：持有 `root: RequestState<T>` 和 `scope: ScopeKey`，实现 `get()` 读取 `requestStorage` 中 `scopeMap[scope]`，`in()` 代理回 `root.in(key)`
- [x] 2.11 在 `RequestState` 中实现 `_createView(scopeKey)` 返回 `new RequestStateScopedView(this, scopeKey)`
- [x] 2.12 更新 `RequestState.get()` 读取 `requestStorage.getStore()?.get(GLOBAL_SCOPE)?.get(this.symbol)`

## 3. StateSetter 与框架内部写入

- [x] 3.1 定义 `StateSetter = <T>(state: ScopedState<T>, value: T) => void` 类型并导出
- [x] 3.2 在 `modules/core/index.ts` 中实现 module-private 函数 `internalSet<T>(state: ScopedState<T>, value: T): void`，写入 `GLOBAL_SCOPE`（区分 AppState / RequestState 两路径）
- [x] 3.3 将 `processStates()` 中所有 `XxxState.set(...)` 调用替换为 `internalSet(XxxState, ...)`
- [x] 3.4 将 `Raven.handle()` 中 `RavenContext.set(ctx)` 调用（两处）替换为 `internalSet(RavenContext, ctx)`

## 4. Plugin 接口与 register() 重构

- [x] 4.1 更新 `Plugin` 接口：移除 `states` 字段与泛型，`load` 签名改为 `load(app: Raven, set: StateSetter): void | Promise<void>`
- [x] 4.2 更新 `definePlugin` 函数：移除泛型，改为 `function definePlugin(plugin: Plugin): Plugin`
- [x] 4.3 更新 `Raven.register()` 签名为 `async register(plugin: Plugin, scopeKey?: string): Promise<void>`
- [x] 4.4 在 `register()` 中实现 scope 绑定的 `StateSetter` 工厂：根据 `state instanceof AppState / RequestState` 分别写入对应 scope 的 Map
- [x] 4.5 在 `register()` 中将 `plugin.load(this)` 改为 `plugin.load(this, set)`，移除 states 返回值逻辑

## 5. 更新类型导出

- [x] 5.1 从 `modules/core/index.ts` 的公共导出中移除 `createAppState` / `createRequestState` 的 set-related 类型（如有独立类型声明）
- [x] 5.2 确认 `StateSetter`、`ScopeKey` 已在公共导出列表中
- [x] 5.3 从公共导出中移除 `Plugin` 的泛型形式（如有 re-export）

## 6. 更新单元测试

- [x] 6.1 更新 `tests/unit/core/state.test.ts`：移除所有直接调用 `State.set()` 的测试，改为通过 `internalSet` 或 `StateSetter` 模式写入
- [x] 6.2 新增 `AppState.in(scopeKey).get()` 读取测试（全局 Scope 与具名 Scope 隔离）
- [x] 6.3 新增 `RequestState.in(scopeKey).get()` 读取测试（同一请求内多 Scope 隔离）
- [x] 6.4 新增 `in()` 引用相等性测试（`DBState.in('S1') === DBState.in('S1')`）
- [x] 6.5 新增 `in()` 链式重置测试（`DBState.in('S1').in('S2') === DBState.in('S2')`）
- [x] 6.6 更新 `tests/unit/core/plugin.test.ts`：移除 `states` 字段，更新 `load(app, set)` 签名，移除 `register()` 返回值相关断言
- [x] 6.7 新增 `register(plugin, scopeKey)` 测试：多 Scope 注册后通过 `State.in(key).get()` 验证隔离
- [x] 6.8 新增 Setter 在 hook 闭包中正确写入 RequestState 的集成测试
- [x] 6.9 运行全部测试，确保通过：`bun test`
