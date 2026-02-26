## MODIFIED Requirements

### Requirement: 注册插件 (Registering Plugins)

框架必须提供 `register` 方法用于注册插件，该方法仅接受一个 `Plugin` 类型的函数作为参数。插件的配置应当通过插件工厂函数预先处理。

#### Scenario: 成功注册插件

- **WHEN** 调用 `raven.register(myPlugin)`
- **THEN** 插件函数应当被执行，且其内部注册的功能生效

#### Scenario: 异步插件注册

- **WHEN** 调用 `await raven.register(asyncPlugin)`
- **THEN** 框架必须等待插件返回的 `Promise` 解析完成后再继续
