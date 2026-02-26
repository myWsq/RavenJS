## Context

当前 RavenJS 的 `Context` 在请求处理的最早期就被创建并注入到作用域中。由于此时尚未进行路由匹配，`Context` 中无法包含路径参数（`params`）。此外，插件系统通过 `register(plugin, opts)` 进行注册，这种方式强制将配置参数透传给 `register` 方法，增加了核心框架的类型负担。虽然 `packages/plugins` 已存在，但其设计尚未与新的插件系统对齐。

## Goals / Non-Goals

**Goals:**

- 将 `Context` 的组装时机延迟到路由匹配之后，确保其包含完整的请求元数据。
- 简化插件注册流程，采用工厂函数模式处理插件配置。
- 适配已有的 `packages/plugins` 官方插件。

**Non-Goals:**

- 不涉及具体的官方插件复杂业务逻辑实现。
- 不修改底层 HTTP 适配器层。

## Decisions

### 1. Context 延迟组装与生命周期调整

- **决策**: `handleRequest` 的执行流程调整为：
  1. 执行全局 `onRequest` 钩子（接收原始 `Request`）。
  2. 进行路由匹配（Router Match）。
  3. 如果匹配成功，从路由匹配结果中提取 `params`，从 URL 中解析 `query`数据。
  4. 创建完整的 `Context` 实例并调用 `RavenContext.set(ctx)`。
  5. 执行后续生命周期钩子（`beforeHandle` 等）。
- **理由**: 确保开发者在处理函数中使用的 `Context` 总是包含最完整的信息。

### 2. Vite 风格的插件注册机制

- **决策**: 重构 `Plugin` 类型定义。
  ```typescript
  export type Plugin = (instance: Raven) => void | Promise<void>;
  ```
- **决策**: 废弃 `register(plugin, opts)` 中的 `opts` 参数。

  ```typescript
  // 新的使用方式
  app.register(myPlugin({ key: "value" }));

  // 插件定义方式
  export function myPlugin(options: MyOptions): Plugin {
    return (instance) => {
      // 注册钩子或功能
    };
  }
  ```

- **理由**: 解耦配置逻辑与注册逻辑，符合现代前端与 Node.js 框架的惯例，提高类型安全性。

### 3. 官方插件代码适配

- **决策**: 更新 `packages/plugins` 中的现有代码，确保其导出的是符合新规范的工厂函数或直接的插件函数。

## Risks / Trade-offs

- **[Risk]**: `onRequest` 钩子无法再通过 `RavenContext.get()` 获取完整的 `Context`。
  - **Mitigation**: 明确 `onRequest` 针对原始请求。如果需要包含 params 的上下文，应使用 `beforeHandle`。
- **[Risk]**: 现有插件（如 `packages/plugins/router`）的破坏性变更。
  - **Mitigation**: 直接在本次变更中同步更新官方插件。
