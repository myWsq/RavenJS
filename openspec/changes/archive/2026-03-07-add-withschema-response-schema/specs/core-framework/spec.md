## MODIFIED Requirements

### Requirement: Raven handle 方法处理 HTTP 请求

Raven 框架 SHALL 通过 `handle` 方法处理传入的 HTTP 请求并返回响应。在请求处理过程中，必须按照定义的生命周期顺序执行已注册的钩子函数；对于 schema-aware handler，请求 schema 校验与校验后 State 写入 MUST 发生在 `beforeHandle` 之前，而声明了 `response` schema 的 handler MUST 在业务 handler 返回后、`beforeResponse` 之前尝试完成 response schema 校验与 `Response.json(...)` 包装。

#### Scenario: Handle GET request

- **WHEN** 调用 `app.handle(new Request("http://x/", { method: "GET" }))` 且路径匹配已注册路由
- **THEN** 框架处理该请求
- **AND** 返回符合 Web 标准的 Response 对象

#### Scenario: Handle POST request

- **WHEN** 调用 `app.handle` 且请求为 POST 并携带 body
- **THEN** 框架处理该请求
- **AND** 返回 Response 对象

#### Scenario: Handle different HTTP methods

- **WHEN** 对 `app.handle` 传入不同 HTTP 方法的 Request（GET、POST、PUT、DELETE 等）
- **THEN** 框架按注册的路由与方法分别处理
- **AND** 返回相应的 Response 对象

#### Scenario: 生命周期钩子完整执行链

- **WHEN** 传入标准的 GET 请求且注册了所有类型的钩子，并且匹配到声明了 `response` schema 的 schema-aware handler
- **THEN** 执行顺序 MUST 为：onRequest -> (Context 创建) -> processStates（含请求 schema 校验与 State 写入） -> beforeHandle -> Handler -> response schema 校验/回退判定 -> beforeResponse
- **AND** 最终返回由钩子或 Handler 产出的 Response

#### Scenario: 处理过程中报错进入错误处理

- **WHEN** 在任何生命周期阶段（钩子、请求 schema 校验、response validation hook 或 Handler）发生错误
- **THEN** 框架 MUST 捕获该错误并调用 `onError` 钩子
- **AND** 返回由 `onError` 产生的 Response

### Requirement: HTTP 方法注册

框架 SHALL 提供 `get`, `post`, `put`, `delete`, `patch` 等方法用于注册对应 HTTP 动作的路由。`handler` 可以是一个简单的零参数函数，也可以是由 `withSchema` 返回的 schema-aware handler 描述；当 schema-aware handler 声明了 `response` schema 时，路由系统 SHALL 同时保存请求 schema 与 response schema，以便在处理阶段完成输入校验和输出包装。

#### Scenario: 成功注册并触发 GET 路由

- **WHEN** 调用 `raven.get('/test', handler)` 并发起 `GET /test` 请求
- **THEN** 对应的 `handler` 应当被调用

#### Scenario: 路由不匹配导致 404

- **WHEN** 注册了 `GET /test` 但发起 `GET /wrong` 请求
- **THEN** 框架应当返回 404 响应

#### Scenario: 注册带 response schema 的 schema-aware handler

- **WHEN** 定义 `const h = withSchema({ body: UserSchema, response: UserResponseSchema }, (ctx) => ({ id: ctx.body.id }))` 并调用 `raven.post('/api', h)`
- **THEN** 路由系统 SHALL 正确存储该 handler 关联的请求 schemas 与 response schema
- **AND** 在请求处理时 SHALL 先完成请求校验，再在业务 handler 返回后尝试响应校验与 JSON 响应构造

### Requirement: Schema-Aware Handler 在核心生命周期中执行校验

对于通过 `withSchema` 声明的路由，core SHALL 在 `beforeHandle` 执行前完成 body/query/params/headers 的 schema 校验，并将校验输出写入对应的内建 State；若声明了 `response` schema，core SHALL 在业务 handler 返回后先尝试校验该返回值，成功时将 schema 输出包装为 `Response.json(...)`，失败时触发 response validation hook 并回退为原始返回值的 JSON 响应，然后再继续 `beforeResponse` 流程。

#### Scenario: beforeHandle 读取校验后的状态值

- **WHEN** 某个路由通过 `withSchema({ query: QuerySchema }, handler)` 声明 query schema，且 `QuerySchema` 会将字符串转换为其他输出类型
- **THEN** `beforeHandle` 钩子中读取到的 `QueryState` SHALL 为 `QuerySchema` 的输出值
- **AND** 业务 handler 接收到的 `ctx.query` SHALL 与该状态值一致

#### Scenario: response schema 生成 JSON 响应

- **WHEN** 某个路由通过 `withSchema({ response: UserResponseSchema }, async () => dto)` 声明 response schema，且 `dto` 满足该 schema
- **THEN** core SHALL 使用 `UserResponseSchema` 的输出值构造 `Response.json(...)`
- **AND** `beforeResponse` 钩子接收到的 SHALL 是该自动生成的 Response

#### Scenario: 请求校验失败阻断 beforeHandle 和 handler

- **WHEN** 声明请求 schema 的路由在请求进入后校验失败
- **THEN** core SHALL 在执行 `beforeHandle` 和业务 handler 之前抛出 `ValidationError`
- **AND** 请求 SHALL 进入统一 `onError` 处理流程

#### Scenario: 响应校验失败时回退并继续 beforeResponse

- **WHEN** 声明 `response` schema 的 schema-aware handler 返回了不满足约束的值
- **THEN** core SHALL 触发 response validation hook，并使用原始 handler 返回值构造 `Response.json(...)`
- **AND** `beforeResponse` 钩子 SHALL 继续接收到该回退后的 Response

## ADDED Requirements

### Requirement: Response Schema Mismatch Hook

框架 SHALL 提供一个专门的 response validation hook，用于在 `response` schema mismatch 时执行日志、告警或指标等观测逻辑，而不默认打断主响应链路。

#### Scenario: response schema mismatch 触发专用 hook

- **WHEN** 某个带 `response` schema 的 schema-aware handler 返回了不满足 schema 的值
- **THEN** core SHALL 调用 response validation hook
- **AND** hook SHALL 接收到包含 `responseIssues` 的结构化错误信息

#### Scenario: 未注册 hook 时继续主响应

- **WHEN** 某个带 `response` schema 的 schema-aware handler 返回了不满足 schema 的值，且未注册 response validation hook
- **THEN** core SHALL 继续返回基于原始 handler 返回值构造的 JSON 响应
- **AND** 请求 SHALL 不因该 mismatch 自动进入 `onError`
