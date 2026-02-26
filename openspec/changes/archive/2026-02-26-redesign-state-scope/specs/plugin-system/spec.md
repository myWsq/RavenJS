## MODIFIED Requirements

### Requirement: 对象式插件定义 (Object Plugin Definition)

插件 SHALL 被定义为一个符合 `Plugin` 接口的对象（或返回 `Plugin` 对象的工厂函数）。`Plugin` 对象 SHALL 包含 `name`（string）和 `load(app: Raven, set: StateSetter)` 方法。`name` 字段 MUST 为非空字符串，用于在错误信息中标识插件来源。`Plugin` 接口不再包含 `states` 字段，不再有泛型参数。

#### Scenario: 定义带配置的对象式插件

- **WHEN** 定义函数 `myPlugin(opts) { return { name: 'my-plugin', load(app, set) { ... } } }`
- **THEN** 该函数符合官方插件定义规范，`opts` 类型完全由插件开发者控制

#### Scenario: 使用 definePlugin 辅助函数

- **WHEN** 使用 `definePlugin({ name: 'x', load(app, set) {} })` 包裹插件对象
- **THEN** TypeScript SHALL 接受该对象并返回相同对象，不产生任何编译错误
- **AND** `definePlugin` 不再有泛型参数，仅作 identity 辅助函数

---

### Requirement: 简化插件注册方法 (Simplified Register Method)

`Raven` 实例的 `register` 方法 SHALL 接受一个 `Plugin` 对象和可选的 `scopeKey?: string`，返回 `Promise<void>`。`register` 不返回任何有意义的值，不支持链式调用。

#### Scenario: 注册插件到全局 Scope

- **WHEN** 调用 `await app.register(myPlugin())`（无第二个参数）
- **THEN** 框架 SHALL 调用 `plugin.load(app, set)`，其中 `set` 的写入目标为 GLOBAL Scope
- **AND** 返回 `Promise<void>`

#### Scenario: 注册插件到具名 Scope

- **WHEN** 调用 `await app.register(myPlugin(), 'S1')`
- **THEN** 框架 SHALL 调用 `plugin.load(app, set)`，其中 `set` 的写入目标为 `'S1'` Scope
- **AND** 同一插件可多次注册到不同 Scope，各 Scope 的 State 互相独立

#### Scenario: 注册无 scopeKey 和有 scopeKey 的同一插件

- **WHEN** 先调用 `await app.register(sqlPlugin)` 再调用 `await app.register(sqlPlugin, 'S1')`
- **THEN** 两次注册均正常完成
- **AND** global Scope 和 `'S1'` Scope 各自持有独立的 State 值

---

### Requirement: 提供 Raven 实例访问 (Raven Instance Access)

`load(app: Raven, set: StateSetter)` 方法 MUST 接收完整的 `Raven` 实例和一个 scope 绑定的 `StateSetter` 函数。插件可以调用任意 `Raven` 实例方法（注册路由、钩子等），并通过 `set` 写入 State。

#### Scenario: 在插件 load 中注册钩子并使用 setter 写入 RequestState

- **WHEN** 插件在 `load(app, set)` 中调用 `app.beforeHandle(() => { set(TxState, beginTx()) })`
- **THEN** 该 hook 被成功注册，且 hook 执行时 `set(TxState, ...)` 将值写入 load 时对应的 Scope

#### Scenario: 在插件 load 中直接写入 AppState

- **WHEN** 插件在 `load(app, set)` 中调用 `set(DBState, connect())`
- **THEN** `DBState` 的值在该 Scope 下立即可读

## REMOVED Requirements

### Requirement: 插件 states 字段声明与返回

**Reason**: `Plugin.states` 字段与 `register()` 返回 states 元组的模式被新的 `StateSetter` + `State.in()` 机制替代。State 以模块顶层 export 形式声明，调用方通过静态 import 访问，无需从 `register()` 获取。

**Migration**: 将 `const [DBState] = await app.register(sqlPlugin())` 替换为直接 `import { DBState } from 'sqlPlugin'`；`plugin.states` 字段从 Plugin 定义中移除；`register()` 调用不再需要解构返回值。
