## 1. 类型定义重构

- [x] 1.1 在 `modules/core/index.ts` 中，将 `Plugin` 类型从函数改为泛型对象接口 `Plugin<S extends readonly ScopedState<any>[]>`，包含 `name`、`states`、`load` 字段
- [x] 1.2 移除 `createPlugin` 函数，新增 `definePlugin<S>` 辅助函数，用于 TypeScript 元组类型推断

## 2. register() 方法改造

- [x] 2.1 修改 `Raven.register()` 签名：接受 `Plugin<S>` 对象，返回 `Promise<S>`
- [x] 2.2 在 `register()` 中用 try/catch 包裹 `plugin.load(app)` 的调用，捕获异常后重新抛出包含 `[plugin.name] Plugin load failed: <message>` 的错误，并将原始错误作为 `cause`
- [x] 2.3 `register()` 末尾返回 `plugin.states`

## 3. 导出更新

- [x] 3.1 在 `modules/core/index.ts` 的 Public API 导出中，移除 `createPlugin` 的导出，新增 `definePlugin` 的导出
- [x] 3.2 确认 `Plugin` 泛型接口正确导出（支持 `Plugin<S>` 使用方式）
