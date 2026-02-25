## Why

现有插件系统将 `Plugin` 定义为一个纯函数 `(instance: Raven) => void`，缺少名称标识、状态声明和结构化元数据，导致插件报错时无法追踪来源，且无法支持「同一插件注册多次、每次拥有独立状态实例」的场景。

## What Changes

- **BREAKING** 将 `Plugin` 类型从函数 `(instance: Raven) => void` 改为对象 `{ name, states, load(app) }`
- **BREAKING** `app.register()` 返回值从 `Promise<this>` 改为 `Promise<S>`（S 为插件声明的 states 元组），不再支持链式调用
- 移除 `createPlugin` 辅助函数，替换为 `definePlugin`，用于 TypeScript 元组类型推断
- `app.register()` 执行 `plugin.load()` 时，若抛出异常，错误信息中包含插件名称 `[plugin-name] load failed: ...`
- 支持三种 State 声明模式，均与现有 `ScopedState` 机制兼容

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `plugin-system`：插件 API 从函数式改为对象式；新增 `name`、`states` 字段；`register()` 返回 states 元组；插件注册错误归因到插件名

## Impact

- `modules/core/index.ts`：修改 `Plugin` 类型定义、`register()` 方法实现与返回类型、移除 `createPlugin` 并新增 `definePlugin`
- `modules/schema-validator/`：不受影响（未使用插件系统）
- 破坏性变更，无需向后兼容（目前无外部用户）
