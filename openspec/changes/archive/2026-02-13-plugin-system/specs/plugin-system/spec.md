## ADDED Requirements

### Requirement: 注册插件 (Registering Plugins)

框架必须提供 `register` 方法用于注册插件，该方法接受一个插件定义和可选的配置选项。

#### Scenario: 成功注册并初始化同步插件

- **WHEN** 调用 `raven.register(syncPlugin)`
- **THEN** 插件的初始化函数应当被立即执行，且插件内注册的功能生效

#### Scenario: 成功注册并初始化异步插件

- **WHEN** 调用 `await raven.register(asyncPlugin)`
- **THEN** 框架必须等待插件的 `Promise` 解析完成后，才认为注册完成

### Requirement: 提供 Raven 实例访问

插件初始化函数必须接收当前的 `Raven` 实例作为第一个参数，以便插件能够调用实例方法（如注册钩子等）。

#### Scenario: 在插件中注册钩子

- **WHEN** 插件通过接收到的 `instance` 参数调用 `instance.onRequest(hook)`
- **THEN** 该钩子应当被成功注册到框架的全局生命周期中
