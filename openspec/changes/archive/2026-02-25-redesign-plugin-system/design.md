## Context

当前 `Plugin` 类型定义为 `(instance: Raven) => void | Promise<void>`，是一个纯函数。`createPlugin` 是 identity 辅助函数，仅用于类型推断。`register()` 返回 `Promise<this>` 以支持链式调用。

这种设计的问题：

1. 插件没有名称，报错时无法确定是哪个插件引起的
2. 同一插件注册多次时，无法为每次注册提供独立的状态实例（State 只能声明在模块顶层成为单例）
3. `Plugin` 作为纯函数，缺乏可内省的结构

## Goals / Non-Goals

**Goals:**

- 将 `Plugin` 改为带 `name`、`states`、`load` 字段的结构化对象
- `register()` 返回 `states` 元组，支持「插件内声明 State、调用方解构使用」的模式
- `load()` 抛异常时，错误信息包含插件名称，便于排查
- 提供 `definePlugin` 辅助函数，帮助 TypeScript 将 `states` 推断为元组而非数组

**Non-Goals:**

- 不限制 `load(app)` 对 `Raven` 实例的访问权限
- 不实现插件依赖声明或顺序强制（调用方通过代码顺序和参数传递隐式保证）
- 不在运行时 hook 报错时归因插件（仅归因 `load` 阶段）
- 不保持与旧函数式 Plugin API 的向后兼容

## Decisions

### 决策 1：Plugin 改为对象而非函数

**选择**：`Plugin<S> = { name: string; states: S; load(app: Raven): void | Promise<void> }`

**备选**：保留函数式，通过 `plugin.pluginName` 属性附加元数据（Fastify 的做法）

**理由**：对象形式语义更清晰，`states` 字段作为 `register()` 返回值有明确归属；函数附属属性方式类型推断复杂且不符合直觉。

---

### 决策 2：`register()` 返回 `Promise<S>`（states 元组）

**选择**：放弃链式调用，返回 states 元组

```typescript
async register<S extends readonly ScopedState<any>[]>(plugin: Plugin<S>): Promise<S>
```

**备选**：返回 `{ app: this; states: S }` 同时保留链式能力

**理由**：调用方只需要 states，复合返回值会让解构变冗长。多次注册用分行 `await` 替代链式，可读性同等。

---

### 决策 3：三种 State 模式均由现有机制支持

无需框架新增机制，三种模式天然兼容：

| 模式                               | State 声明位置                       | 适用场景                       |
| ---------------------------------- | ------------------------------------ | ------------------------------ |
| A. 模块顶层单例                    | 插件文件顶层 `export`                | 全局拦截、单一来源状态         |
| B. 插件内声明（via `states` 返回） | 工厂函数内 `createXxxState()`        | 多实例独立状态                 |
| C. 调用方传入                      | 调用方 `createXxxState()` + 参数传入 | 插件间依赖、调用方控制生命周期 |

---

### 决策 4：`definePlugin` 替换 `createPlugin`

`states: [ConfigState]` 在没有辅助函数时 TypeScript 推断为 `ScopedState<any>[]`（数组），而非 `[AppState<Config>]`（元组），导致 `register()` 返回类型丢失。

`definePlugin` 通过泛型约束强制元组推断：

```typescript
function definePlugin<S extends readonly ScopedState<any>[]>(plugin: {
  name: string;
  states: S;
  load(app: Raven): void | Promise<void>;
}): Plugin<S>;
```

---

### 决策 5：仅归因 `load()` 阶段错误

`load()` 执行期间用 try/catch 包裹，re-throw 时注入插件名：

```
[plugin-name] Plugin load failed: <original message>
```

运行时 hook 报错不归因到插件（hook 执行时已脱离注册上下文，stack trace 已足够调试）。

## Risks / Trade-offs

- **Breaking change**：`Plugin` 类型完全改变，旧插件需要重写 → 当前无外部用户，可接受
- **失去链式调用**：`await app.register(a).register(b)` 不再可用 → 改为分行 `await` 同等清晰
- **`definePlugin` 非强制**：插件作者可以不用 `definePlugin` 直接返回对象字面量，此时需要 `as const` 才能保证类型正确 → 文档说明即可，不影响运行时行为
