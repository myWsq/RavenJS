## Context

Raven 框架目前仅支持基础的请求处理。为了增强扩展性，需要实现一套类似于常用 Web 框架（如 Fastify, Elysia）的生命周期钩子系统。

## Goals / Non-Goals

**Goals:**
- 提供 `onRequest`, `beforeHandle`, `beforeResponse`, `onError` 四个核心钩子。
- 支持异步钩子（Async Hooks）。
- 支持钩子链式执行，且部分钩子支持“短路”逻辑（即直接返回 Response 终止后续流程）。
- 确保所有钩子阶段产生的错误都能被 `onError` 捕获。
- 保持高性能，避免不必要的对象创建。

**Non-Goals:**
- 本阶段不实现全局/局部路由级别的钩子（仅实现全局应用级钩子）。
- 不实现 `onResponse`（请求发出后的钩子，通常用于清理）。

## Decisions

### 1. 钩子存储结构
在 `Raven` 类中维护一个私有的 `hooks` 对象，存储各阶段的钩子函数数组。

```typescript
private hooks = {
    onRequest: [] as OnRequestHook[],
    beforeHandle: [] as BeforeHandleHook[],
    beforeResponse: [] as BeforeResponseHook[],
    onError: [] as OnErrorHook[]
};
```

### 2. 钩子函数签名

- **onRequest**: `(request: Request) => void | Response | Promise<void | Response>`
  - 最早触发，仅能访问原始 `Request`。如果返回 `Response`，则跳过后续所有步骤（包括 Handler）直接进入 `beforeResponse`。
- **beforeHandle**: `() => void | Response | Promise<void | Response>`
  - 在 Handler 执行前触发。如果返回 `Response`，则跳过 Handler。
- **beforeResponse**: `(response: Response) => void | Response | Promise<void | Response>`
  - 在 Handler 或前置钩子产生 `Response` 后触发。可以替换或修改响应。
- **onError**: `(error: unknown) => Response | Promise<Response>`
  - 捕获生命周期中任何位置抛出的异常。必须返回一个 `Response` 作为最终响应。

### 3. 执行管道重构
将 `handleRequest` 重构为顺序执行的异步管道：

1. 执行 `onRequest` 链。
2. 构造 `Context` 对象。
3. 执行 `beforeHandle` 链。
4. 执行业务 `Handler`（如果有）。
5. 执行 `beforeResponse` 链。
6. 处理过程中任何错误均跳转至 `onError`。

## Risks / Trade-offs

- **[Risk]** 钩子过多导致性能下降 → **[Mitigation]** 仅在存在已注册钩子时才执行对应的遍历逻辑。
- **[Risk]** 错误处理逻辑复杂化 → **[Mitigation]** 使用统一的 `try-catch` 包装整个 `handleRequest` 逻辑。
