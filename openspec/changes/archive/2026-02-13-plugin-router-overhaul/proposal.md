## Why

当前 `Context` 的组装时机过早，导致在 `onRequest` 钩子执行时无法获取路由参数和查询参数。同时，现有的插件注册机制（`register(plugin, opts)`）与 Vite 等现代框架的风格不符，显得过于繁琐。此外，虽然 `packages/plugins` 基础结构已存在，但其内部的路由插件及相关机制仍需按照新的设计进行完善。

## What Changes

- **路由与 Context 优化**:
  - 将 `Context` 的组装时机移至 `onRequest` 钩子执行之后及路由匹配成功之后。
  - 在 `Context` 中包含 `params` 和 `query` 数据。
- **插件系统重构**:
  - **BREAKING**: 重构 `register` 方法，不再接受额外的 `opts` 参数。插件应采用工厂函数模式（如 `plugin(opts)`），在调用 `register` 时直接传入执行后的插件实例。
  - 修改 `Plugin` 类型定义，使其更符合现代插件化架构。
- **官方插件库完善**:
  - 在已有的 `packages/plugins` 目录下，完善官方插件的实现模式，使其适配新的工厂函数风格。

## Capabilities

### New Capabilities

- `vite-style-plugin-system`: 实现类似 Vite 的插件定义和注册机制，通过工厂函数预配置参数。

### Modified Capabilities

- `routing-system`: 调整 `Context` 的生命周期，确保其包含完整的路由元数据。
- `lifecycle-hooks`: 更新钩子执行逻辑，明确各阶段 `Context` 的可用状态。

## Impact

- `packages/core/main.ts`: 修改 `Raven` 类的 `register` 和 `handleRequest` 方法。
- `packages/plugins/router`: 更新现有的路由插件示例以适配新模式。
- 插件开发者需要调整插件定义方式。
