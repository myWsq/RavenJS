## MODIFIED Requirements

### Requirement: 对象式插件定义 (Object Plugin Definition)

插件 SHALL 被定义为一个返回 `Plugin<S>` 对象的工厂函数。`Plugin<S>` 对象 SHALL 包含 `name`（string）、`states`（ScopedState 元组）和 `load(app: Raven)` 方法。`name` 字段 MUST 为非空字符串，用于在错误信息中标识插件来源。

#### Scenario: 定义带配置的对象式插件

- **WHEN** 定义函数 `myPlugin(opts) { return { name: 'my-plugin', states: [], load(app) { ... } } }`
- **THEN** 该函数符合官方插件定义规范，`opts` 类型完全由插件开发者控制

#### Scenario: 使用 definePlugin 辅助函数

- **WHEN** 使用 `definePlugin({ name: 'x', states: [someState], load(app) {} })` 包裹插件对象
- **THEN** TypeScript SHALL 将 `states` 推断为元组类型而非数组类型，且不影响运行时行为

### Requirement: 简化插件注册方法 (Simplified Register Method)

`Raven` 实例的 `register` 方法 SHALL 接受一个 `Plugin<S>` 对象，并返回 `Promise<S>`（即插件声明的 states 元组）。`register` 不再返回 `this`，不支持链式调用。

#### Scenario: 注册带 states 的插件并获取返回值

- **WHEN** 调用 `const [configState] = await app.register(myPlugin('value'))`
- **THEN** 框架 SHALL 调用 `plugin.load(app)` 并返回 `plugin.states` 元组
- **AND** `configState` 的类型 SHALL 与 `plugin.states[0]` 的类型一致

#### Scenario: 注册 states 为空的插件

- **WHEN** 调用 `await app.register(myPlugin())` 其中 `plugin.states` 为 `[]`
- **THEN** 框架 SHALL 正常执行 `plugin.load(app)`，返回空数组

### Requirement: 异步插件注册 (Async Plugin Registration)

框架 MUST 等待 `plugin.load(app)` 返回的 `Promise` 解析完成后再继续执行。

#### Scenario: 异步插件注册

- **WHEN** `plugin.load(app)` 返回一个 Promise
- **THEN** `await app.register(plugin)` MUST 在该 Promise resolve 后才 resolve

### Requirement: 插件加载错误归因 (Plugin Load Error Attribution)

当 `plugin.load(app)` 抛出异常时，框架 MUST 将错误包装并在消息中包含插件名称。

#### Scenario: load 阶段抛出错误

- **WHEN** `plugin.load(app)` 抛出 `Error('connection refused')`
- **THEN** `app.register(plugin)` SHALL 抛出包含 `[my-plugin] Plugin load failed: connection refused` 的错误
- **AND** 原始错误 SHALL 作为 `cause` 保留

### Requirement: 提供 Raven 实例访问 (Raven Instance Access)

`load(app: Raven)` 方法 MUST 接收完整的 `Raven` 实例，插件可以调用任意实例方法（注册路由、钩子等）。

#### Scenario: 在插件 load 中注册钩子

- **WHEN** 插件在 `load(app)` 中调用 `app.onRequest(hook)`
- **THEN** 该钩子 SHALL 被成功注册到框架全局生命周期中

## REMOVED Requirements

### Requirement: 工厂函数式插件定义 (Factory Pattern Plugin Definition)

**Reason**: 替换为对象式插件定义（Object Plugin Definition）。Plugin 从函数类型改为对象类型，`load(app)` 方法承担原函数的职责。

**Migration**: 将 `(instance) => { ... }` 改为 `{ name: 'x', states: [], load(app) { ... } }`

### Requirement: createPlugin 辅助函数

**Reason**: 替换为 `definePlugin`，新辅助函数支持 TypeScript 元组类型推断。

**Migration**: 将 `createPlugin(fn)` 替换为 `definePlugin({ name, states, load })`
