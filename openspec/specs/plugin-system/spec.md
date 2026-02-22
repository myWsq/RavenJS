# Plugin System Specification

> **Migration Note**: This spec consolidates the following original specs:
> - `plugin-system`
> - `vite-style-plugin-system`

## Purpose

定义 RavenJS 的插件系统，支持工厂函数式插件定义、简化注册方法，以及提供插件包结构标准。

## Requirements

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

### Requirement: 注册插件 (Registering Plugins)

框架必须提供 `register` 方法用于注册插件，该方法仅接受一个 `Plugin` 类型的函数作为参数。插件的配置应当通过插件工厂函数预先处理。

#### Scenario: 成功注册插件

- **WHEN** 调用 `raven.register(myPlugin)`
- **THEN** 插件函数应当被执行，且其内部注册的功能生效

#### Scenario: 异步插件注册

- **WHEN** 调用 `await raven.register(asyncPlugin)`
- **THEN** 框架必须等待插件返回的 `Promise` 解析完成后再继续

### Requirement: 提供 Raven 实例访问

插件初始化函数必须接收当前的 `Raven` 实例作为第一个参数，以便插件能够调用实例方法（如注册钩子等）。

#### Scenario: 在插件中注册钩子

- **WHEN** 插件通过接收到的 `instance` 参数调用 `instance.onRequest(hook)`
- **THEN** 该钩子应当被成功注册到框架的全局生命周期中

### Requirement: 插件包结构 (Plugin Package Structure)

在 `packages/` 目录下必须存在 `plugins/` 文件夹，该文件夹作为一个独立的工作区成员管理。

#### Scenario: 验证目录存在

- **WHEN** 检查项目根目录下的 `packages/` 文件夹
- **THEN** 应当存在 `plugins/` 目录

### Requirement: 基础构建配置 (Base Build Configuration)

`plugins/` 目录必须包含标准的 TypeScript 项目配置，允许各个子插件共享或独立构建。

#### Scenario: 验证 package.json

- **WHEN** 检查 `packages/plugins/package.json`
- **THEN** 应当定义为一个 `monorepo` 工作区包，或者作为核心库的对等依赖包
