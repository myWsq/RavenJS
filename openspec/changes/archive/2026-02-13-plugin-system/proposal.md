## Why

目前 Raven 框架的功能扩展依赖于手动注册生命周期钩子（如 `onRequest`, `beforeHandle` 等），缺乏良好的模块化和封装机制。随着功能的增加，`Raven` 类将变得臃肿，难以维护。
引入插件系统，可以实现功能的模块化拆分、代码复用，从而提升框架的可扩展性和可维护性。

## What Changes

- 在 `Raven` 类中引入 `register` 方法，用于注册插件。
- 定义标准的 `Plugin` 接口，支持同步和异步的插件初始化。
- 为插件提供访问 `Raven` 实例的能力，允许插件注册生命周期钩子或执行其他初始化逻辑。
- 建立标准的插件构建方案，统一内外部插件的开发体验。

## Capabilities

### New Capabilities

- `plugin-system`: 提供核心的插件注册和初始化机制，支持 `Raven.register()` API。

### Modified Capabilities

- `lifecycle-hooks`: 扩展生命周期钩子，使其能够与插件系统集成。

## Impact

- `packages/main/index.ts`: `Raven` 类将新增 `register` 方法。
- 插件将成为扩展框架功能的主要方式。
