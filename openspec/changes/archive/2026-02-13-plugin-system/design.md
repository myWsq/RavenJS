## Context

当前 Raven 实例的所有生命周期钩子都存储在单一的全局列表中。为了支持插件系统，我们需要提供一种标准的方式来组织和注册这些逻辑。

## Goals / Non-Goals

**Goals:**
- 提供 `raven.register(plugin, options)` API。
- 支持异步插件初始化（Awaiting `register`）。

**Non-Goals:**
- 实现插件作用域隔离（暂不考虑）。
- 实现复杂的插件依赖树排序。

## Decisions

### 1. 插件定义 (Plugin Definition)
插件将是一个接受 `Raven` 实例和配置选项的函数。
```typescript
type Plugin = (instance: Raven, opts: any) => void | Promise<void>;
```

### 2. 注册机制
`register` 方法将直接在当前 `Raven` 实例上执行插件函数。

## Risks / Trade-offs

- **[Risk] 全局污染** → 插件内部注册的所有钩子都是全局生效的。
  - **Mitigation**: 开发者需要注意插件的加载顺序。

## Migration Plan

- 现有的 `onRequest`, `beforeHandle` 等方法保持不变。
