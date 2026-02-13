## Context

当前 RavenJS 的核心逻辑集中在 `packages/core`。为了支持官方插件并优化路由系统的 Context 组装逻辑，需要建立专门的插件包目录，并调整请求生命周期的执行顺序。

## Goals / Non-Goals

**Goals:**
- 建立 `packages/plugins` 目录及基础构建环境。
- 将路由匹配及 `params`/`query` 的提取逻辑延迟到 `onRequest` 之后。
- 确保 `Context` 对象在 `beforeHandle` 阶段已包含完整的路由元数据。

**Non-Goals:**
- 本次设计不涉及具体某个插件（如 Logger）的详细实现，仅关注基础设施。
- 不修改核心库的插件注册机制（`register` 方法）。

## Decisions

### 1. 插件目录结构
采用 `packages/plugins/<plugin-name>` 的扁平结构。
- **理由**: 方便通过工作区（Workspace）管理，且每个插件可以有独立的 `package.json`。
- **备选方案**: 全部插件放在一个包里。缺点：版本管理和依赖会变得复杂。

### 2. Context 组装时机
在 `packages/core/index.ts` 中，将 `Context` 的实例化和属性赋值放在 `onRequest` 钩子循环执行之后。
- **逻辑流**: `Request Received` -> `Run onRequest Hooks` -> `Match Route` -> `Extract Params/Query` -> `Create Context` -> `Run beforeHandle Hooks` -> `Execute Handler`.
- **理由**: 满足用户关于 `onRequest` 不应包含路由信息的性能/逻辑需求，并确保 `beforeHandle` 能拿到路由参数。

### 3. 路由插件化
虽然路由是核心功能，但其实现逻辑可以放在 `packages/plugins/router`（如果需要高度可替换性），或者保留在 `core` 中但在生命周期上配合插件系统。
- **当前选择**: 先在 `core` 中优化生命周期，为后续路由插件化打下基础。

## Risks / Trade-offs

- **[Risk]** Context 延迟组装可能导致 `onRequest` 钩子无法访问某些便捷属性。
  - **Mitigation**: 在 `onRequest` 文档中明确说明其职责是处理原始请求，而非业务逻辑。
- **[Risk]** Monorepo 依赖复杂性。
  - **Mitigation**: 使用 Bun 的 Workspace 功能统一管理。
