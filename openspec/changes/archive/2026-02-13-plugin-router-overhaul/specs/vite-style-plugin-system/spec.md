## ADDED Requirements

### Requirement: 工厂函数式插件定义 (Factory Pattern Plugin Definition)

插件应当被定义为一个返回 `Plugin` 类型函数的工厂函数。`Plugin` 类型函数 SHALL 仅接收 `instance: Raven` 作为唯一参数。

#### Scenario: 定义带配置的插件

- **WHEN** 定义一个函数 `myPlugin(opts) { return (instance) => { ... } }`
- **THEN** 该函数符合官方插件定义规范，且 `opts` 类型完全由插件开发者控制

### Requirement: 简化插件注册方法 (Simplified Register Method)

`Raven` 实例的 `register` 方法 SHALL 仅接受一个参数：即 `Plugin` 函数。不再直接支持在 `register` 方法中传入配置选项。

#### Scenario: 注册执行后的插件

- **WHEN** 调用 `app.register(myPlugin({ key: 'value' }))`
- **THEN** 框架 SHALL 调用该返回的函数并传入 `app` 实例
- **AND** 整个过程不再涉及框架核心对 `opts` 的处理
