# Raven Logic-Layer Refactoring Design

## Context

Raven 当前在 `modules/core/index.ts` 的 `Raven` 类中同时包含：

- **逻辑层**：路由、hooks、state、handler 执行，入口为 `handleRequest(request) => Response`
- **传输层**：`listen()` 调用 `Bun.serve`，`stop()` 停止服务器

测试与 benchmark 均直接调用 `handleRequest`，从不使用 `listen()`。Raven 核心仅依赖 Web API（Request/Response）和 `node:async_hooks`，与 Bun 的唯一耦合点在 `listen()`。

## Goals / Non-Goals

**Goals:**

- 将 Raven 重构为纯逻辑层：仅暴露 `handle(request) => Promise<Response>`，不包含 HTTP 服务器启动
- 移除 `listen()`、`stop()`、`server` 属性及 `Bun.serve` 依赖
- 将 `handleRequest` 重命名为更具语义的方法名（建议 `handle`）
- 文档说明如何将 Raven 接入 Bun.serve 或其他 Fetch 环境

**Non-Goals:**

- 不提供独立 adapters 包（可后续在文档或示例中给出接入方式）
- 不处理 AsyncLocalStorage 在非 Node 环境的替代实现
- 不追求向后兼容

## Decisions

### Decision 1: 新方法命名为 `handle`

**选择**: `handle` 作为 Request → Response 处理入口的方法名

**备选**:

- `handleRequest`: 与现有一致，但 "Request" 暗示网络请求
- `dispatch`: 常见于事件/消息分发，语义略偏
- `process`: 过于通用
- `fetch`: 与 Web fetch() 同名，易混淆

**理由**: `handle` 简洁，表示「处理一个请求」，与 FetchHandler 的语义一致，且不暗示传输层。

### Decision 2: 不在 core 中提供 listen/stop 的替代

**选择**: 完全移除，用户需自行接入服务器

**备选**:

- 在 core 中保留可选的 `toFetchHandler()` 或 `asFetchHandler` getter，返回 `this.handle`：当前 `handle` 本身即为 FetchHandler，无需额外封装
- 单独包提供 Bun adapter：增加复杂度，暂不采纳

**理由**: 逻辑层不应持有「如何启动服务器」的知识；文档可给出 `Bun.serve({ fetch: app.handle })` 示例。

### Decision 3: 导出类型 FetchHandler

**选择**: 可导出类型别名 `type FetchHandler = (req: Request) => Response | Promise<Response>`，便于用户类型标注

**备选**: 不导出，用户直接使用 `typeof app.handle`

**理由**: 显式类型有助于文档和类型推断，实现成本低。

### Decision 4: 不引入 adapter 模块

**选择**: 本次变更仅在 core 内完成，不创建 `@raven/bun` 等新包

**理由**: 用户可直接在应用层写 `Bun.serve({ fetch: app.handle })`，无需框架提供封装；若未来需求增加再考虑。

## Risks / Trade-offs

| Risk                                   | Mitigation                                      |
| -------------------------------------- | ----------------------------------------------- |
| 依赖 `listen()` 的示例或脚本需手动迁移 | 在 README 中提供迁移示例；变更明确标注 BREAKING |
| 方法名 `handle` 与某些库冲突           | `handle` 为常见词，Raven 实例方法，作用域明确   |
| 用户期望「开箱即用」的 `app.listen()`  | 文档强调 Raven 为逻辑层，并提供 1 行接入示例    |
