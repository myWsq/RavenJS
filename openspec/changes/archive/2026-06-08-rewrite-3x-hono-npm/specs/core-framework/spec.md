## MODIFIED Requirements

### Requirement: Bun-only 运行时

Raven 框架 SHALL 支持 Node + Bun + Deno（server 端）三种运行时，SHALL NOT 声明 edge/Workers 支持。框架 SHALL NOT 自带 serve 实现，serve 经 Hono 官方 adapter 完成（Node 用 `@hono/node-server`，Bun/Deno 用原生 fetch）。因运行时收敛在 server 端，`AsyncLocalStorage` SHALL 无条件可用。文档 SHALL 明确声明受支持的运行时集合。

#### Scenario: 在 Node 下启动服务

- **WHEN** 用户在 Node 运行时启动 HTTP 服务
- **THEN** 用户 SHALL 使用 `@hono/node-server` 之类官方 adapter 承载框架暴露的 Hono 实例/fetch handler
- **AND** 框架自身不提供监听端口能力

#### Scenario: 在 Bun / Deno 下启动服务

- **WHEN** 用户在 Bun 或 Deno 运行时启动 HTTP 服务
- **THEN** 用户 SHALL 将框架暴露的 fetch handler 交给运行时原生 fetch serve
- **AND** 框架内 SHALL NOT 出现任何运行时检测分支

#### Scenario: 运行时声明

- **WHEN** 用户在选择运行环境
- **THEN** 文档 SHALL 声明支持 Node + Bun + Deno（server）
- **AND** 文档 SHALL 声明不支持 edge/Workers

### Requirement: Raven 作为逻辑层暴露 handle 方法

Raven 框架 SHALL 作为逻辑层，自身不监听端口；其 HTTP 收发与路由由内部 Hono 实例承担。Raven 类 SHALL 暴露一个 fetch handler（接收 Web API `Request`，返回 `Promise<Response>`，实现 FetchHandler 语义），并 SHALL 提供获取内部 Hono 实例的途径，以便经官方 adapter serve。

#### Scenario: 暴露 fetch handler 处理 Request 返回 Response

- **WHEN** 调用框架暴露的 fetch handler 且请求匹配已注册路由
- **THEN** 框架执行完整生命周期（onRequest、beforeHandle、Handler、beforeResponse）
- **AND** 返回 Web 标准 `Response` 对象

#### Scenario: fetch handler 作为运行时 fetch 回调

- **WHEN** 用户需要在 Bun/Deno 下启动 HTTP 服务
- **THEN** 可将框架暴露的 fetch handler 作为 fetch 回调传入运行时原生 serve
- **AND** 在 Node 下可经 `@hono/node-server` 承载同一 Hono 实例

### Requirement: Raven handle 方法处理 HTTP 请求

Raven 框架 SHALL 经由内部 Hono 实例的根中间件处理传入的 HTTP 请求并返回响应。请求进入后，框架 SHALL 建立 per-request `AsyncLocalStorage` 存储，并将 Hono context `c` 抓入 ambient context 后对应用作者隐藏。在请求处理过程中，必须按照定义的生命周期顺序执行已注册的钩子函数；对于 schema-aware handler，请求 schema 校验与校验后 State 写入 MUST 发生在 `beforeHandle` 之前，而声明了 `response` schema 的 handler MUST 在业务 handler 返回后、`beforeResponse` 之前尝试完成 response schema 校验与 `Response.json(...)` 包装。

#### Scenario: 处理不同 HTTP 方法

- **WHEN** 向框架传入不同 HTTP 方法的 Request（GET、POST、PUT、DELETE 等）且路径匹配已注册路由
- **THEN** 框架经内部 Hono 路由按方法分别处理
- **AND** 返回相应的 Response 对象

#### Scenario: 生命周期钩子完整执行链

- **WHEN** 传入标准的 GET 请求且注册了所有类型的钩子，并且匹配到声明了 `response` schema 的 schema-aware handler
- **THEN** 执行顺序 MUST 为：onRequest -> (Context 创建/ambient 写入) -> processStates（含请求 schema 校验与 State 写入） -> beforeHandle -> Handler -> response schema 校验/回退判定 -> beforeResponse
- **AND** 最终返回由钩子或 Handler 产出的 Response

#### Scenario: 处理过程中报错进入错误处理

- **WHEN** 在任何生命周期阶段（钩子、请求 schema 校验、response validation hook 或 Handler）发生错误
- **THEN** 框架 MUST 捕获该错误并调用 `onError` 钩子
- **AND** 返回由 `onError` 产生的 Response

#### Scenario: Hono context 不泄漏给应用作者

- **WHEN** 钩子或 handler 在请求生命周期内执行
- **THEN** 它们 SHALL NOT 接收 Hono `c`
- **AND** 原始请求信息 SHALL 仅经内建 ambient state 暴露
