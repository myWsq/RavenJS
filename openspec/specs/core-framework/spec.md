# Core Framework Specification

> **Migration Note**: This spec consolidates the following original specs:
> - `runtime-abstraction`
> - `http-server`
> - `lifecycle-hooks`
> - `error-handling`
> - `routing-system`
> - `state-management`
> - `scoped-state`

## Purpose

定义 RavenJS 核心框架的所有基础能力，包括运行时适配、HTTP 服务器、请求生命周期、错误处理、路由系统、状态管理等核心功能。

## Requirements

### Requirement: RavenJS as Agent Teaching Tool

RavenJS SHALL be positioned as an Agent teaching tool rather than a traditional npm framework. The framework code SHALL be provided as reference implementation for Agents to learn from, not as a dependency to import.

#### Scenario: Agent learns from RavenJS code
- **WHEN** an Agent reads the RavenJS reference code and README.md
- **THEN** the Agent SHALL understand how to write code in RavenJS's style
- **AND** the Agent SHALL be able to generate similar code without requiring RavenJS as a dependency

### Requirement: 运行时抽象层

Raven 框架 SHALL 仅支持 Bun 运行时。框架不再提供 Node.js 运行时适配，启动时直接使用 Bun 原生 API（如 `Bun.serve`）。

#### Scenario: 在 Bun 下启动

- **WHEN** 框架在 Bun 运行时下启动
- **THEN** 框架使用 `Bun.serve` 处理 HTTP 请求
- **AND** 服务器正常响应 HTTP 请求

#### Scenario: Node.js 环境不再支持

- **WHEN** 用户尝试在 Node.js 运行时下启动框架
- **THEN** 框架不保证正常工作
- **AND** 文档 SHALL 声明 ravenjs 为 Bun-only

### Requirement: Server can be started with configuration

The Raven framework SHALL provide a method to start an HTTP server with configurable port and optional hostname. 框架必须在 Bun 环境下通过统一的 API 启动。

#### Scenario: Start server with port only

- **WHEN** user calls `app.listen({ port: 3000 })`
- **THEN** server starts listening on port 3000
- **AND** server responds to HTTP requests when running on Bun

#### Scenario: Start server with port and hostname

- **WHEN** user calls `app.listen({ port: 3000, hostname: 'localhost' })`
- **THEN** server starts listening on port 3000 at localhost
- **AND** server responds to HTTP requests

#### Scenario: Default hostname when not specified

- **WHEN** user calls `app.listen({ port: 3000 })` without hostname
- **THEN** server uses default hostname ('0.0.0.0' for Bun)
- **AND** server responds to HTTP requests

### Requirement: Server handles HTTP requests

The Raven framework SHALL process incoming HTTP requests and return responses. 在请求处理过程中，必须按照定义的生命周期顺序执行已注册的钩子函数。

#### Scenario: Handle GET request

- **WHEN** server receives a GET request to any path
- **THEN** server processes the request
- **AND** server returns a standard Response object (Web Standards compliant)

#### Scenario: Handle POST request

- **WHEN** server receives a POST request with body
- **THEN** server processes the request
- **AND** server returns a Response object

#### Scenario: Handle different HTTP methods

- **WHEN** server receives requests with different HTTP methods (GET, POST, PUT, DELETE, etc.)
- **THEN** server processes each request appropriately
- **AND** server returns appropriate Response objects

#### Scenario: 生命周期钩子完整执行链

- **WHEN** 接收到一个标准的 GET 请求，且注册了所有类型的钩子
- **THEN** 执行顺序 MUST 为：onRequest -> (Context 创建) -> beforeHandle -> Handler -> beforeResponse
- **AND** 最终返回由钩子或 Handler 产生的 Response

#### Scenario: 处理过程中报错进入错误处理

- **WHEN** 在任何生命周期阶段（钩子或 Handler）发生错误
- **THEN** 框架 MUST 捕获该错误并调用 `onError` 钩子
- **AND** 返回由 `onError` 产生的 Response

### Requirement: Context provides request and response access

The Raven framework SHALL provide a Context object that encapsulates request and response information for use in request handlers.

#### Scenario: Context contains request information

- **WHEN** a request handler receives a Context object
- **THEN** context.request provides access to the incoming Request object
- **AND** context includes request method, URL, headers, and body

#### Scenario: Context allows setting response

- **WHEN** a request handler receives a Context object
- **THEN** context allows setting response status, headers, and body
- **AND** framework returns the response to the client

### Requirement: Server can be stopped

The Raven framework SHALL provide a method to stop the running server.

#### Scenario: Stop running server

- **WHEN** user calls `app.stop()` or similar method
- **THEN** server stops accepting new requests
- **AND** existing connections are gracefully closed

### Requirement: onRequest 钩子执行

框架 SHALL 支持注册 `onRequest` 钩子，并在接收到请求后第一时间执行。
在 `onRequest` 钩子执行期间，`Context` 尚未组装（不包含 `params` 和 `query`）。路由匹配及 `Context` 的组装必须在该钩子执行完成后进行。此阶段仅允许访问原始 `Request` 对象。

#### Scenario: 成功执行 onRequest 钩子

- **WHEN** 注册了 `onRequest` 钩子并接收到请求
- **THEN** 钩子函数被调用，且传入原始 `Request` 对象
- **AND** 此时尝试获取 `RavenContext` 应当为空或返回基础上下文（不含路由数据）

#### Scenario: onRequest 钩子短路响应

- **WHEN** `onRequest` 钩子返回 a `Response` 对象
- **THEN** 框架 SHALL 停止后续执行（不执行路由匹配、Context 组装、beforeHandle 和 Handler）
- **AND** 直接进入响应阶段

#### Scenario: 上下文作用域覆盖

- **WHEN** `onRequest` 钩子在异步上下文中执行
- **THEN** 该上下文 SHALL 在整个请求处理周期（包括所有后续钩子和 Handler）中保持可用

### Requirement: beforeHandle 钩子执行

框架 SHALL 支持注册 `beforeHandle` 钩子，并在 `Context` 完全创建后、业务 Handler 执行前调用。
`Context` 的完全创建（包含从路由匹配中提取的 `params` 和 `query`）发生在 `onRequest` 钩子执行之后且路由匹配成功之后。

#### Scenario: 成功执行 beforeHandle 钩子

- **WHEN** 注册了 `beforeHandle` 钩子且请求已通过 `onRequest` 阶段并完成路由匹配
- **THEN** 钩子函数被调用
- **AND** 此时 `ctx.params` 和 `ctx.query` 应当已经完全可用

#### Scenario: beforeHandle 钩子短路响应

- **WHEN** `beforeHandle` 钩子返回一个 `Response` 对象
- **THEN** 框架 SHALL 停止执行业务 Handler
- **AND** 直接进入响应阶段

### Requirement: beforeResponse 钩子执行

框架 SHALL 支持注册 `beforeResponse` 钩子，在最终响应发送给客户端前调用，允许修改响应。

#### Scenario: 成功执行 beforeResponse 钩子

- **WHEN** Handler 或前置钩子产生响应后
- **THEN** `beforeResponse` 钩子被调用，且传入当前 `Response` 对象

#### Scenario: beforeResponse 钩子替换响应

- **WHEN** `beforeResponse` 钩子返回一个新的 `Response` 对象
- **THEN** 框架 SHALL 使用该新对象作为最终响应返回给客户端

### Requirement: 全局错误捕获与处理

框架 SHALL 捕获请求生命周期内（包括所有钩子和 Handler）抛出的任何异常，并将其传递给 `onError` 钩子。

#### Scenario: 捕获 Handler 中的错误

- **WHEN** 业务 Handler 抛出异常
- **THEN** 框架捕获该异常并调用已注册的 `onError` 钩子

#### Scenario: 捕获钩子中的错误

- **WHEN** 任何生命周期钩子（如 `onRequest`）抛出异常
- **THEN** 框架捕获该异常并调用已注册的 `onError` 钩子

### Requirement: onError 钩子响应转换

`onError` 钩子 MUST 返回一个 `Response` 对象作为最终结果。

#### Scenario: onError 返回自定义错误响应

- **WHEN** `onError` 钩子被调用并返回一个自定义的 `Response`
- **THEN** 客户端接收到该自定义响应

### Requirement: 标准化错误识别

框架 SHALL 识别并处理 RavenError 实例。

#### Scenario: RavenError 类型识别

- **WHEN** 捕获到的错误是 RavenError 实例
- **THEN** 错误对象 SHALL 包含标准化的 `code`、`message`、`context`、`statusCode` 属性

#### Scenario: RavenError 响应构建

- **WHEN** 调用 `RavenError.toResponse()` 方法
- **THEN** 返回的 Response 对象 SHALL 使用 `statusCode` 属性作为 HTTP 状态码
- **AND** 若 `statusCode` 未设置则默认使用 500

### Requirement: HTTP 方法注册

框架 SHALL 提供 `get`, `post`, `put`, `delete`, `patch` 等方法用于注册对应 HTTP 动作的路由。`handler` 可以是一个简单的函数，也可以是带有 `slots` 元数据的对象（如 `createHandler` 返回的结果）。

#### Scenario: 成功注册并触发 GET 路由

- **WHEN** 调用 `raven.get('/test', handler)` 并发起 `GET /test` 请求
- **THEN** 对应的 `handler` 应当被调用

#### Scenario: 路由不匹配导致 404

- **WHEN** 注册了 `GET /test` 但发起 `GET /wrong` 请求
- **THEN** 框架应当返回 404 响应

#### Scenario: 注册带 Slots 的 Handler

- **WHEN** 定义 `const h = createHandler({ slots: [bodyState] }, ...)` 并调用 `raven.post('/api', h)`
- **THEN** 路由系统应当正确存储并能够识别该 Handler 关联的 slots 元数据
- **AND** 在请求处理时，框架应当自动激活这些 Slots

### Requirement: 路径参数提取

路由系统 SHALL 在路由匹配成功后提取路径参数，并将其提供在组装后的 `ctx.params` 中。在路由匹配前，`Context` 实例及其包含的 `params` 不可用。

#### Scenario: 提取单个路径参数

- **WHEN** 注册路由 `GET /user/:id` 并请求 `GET /user/123`
- **THEN** 在 Handler 或 `beforeHandle` 钩子中，`ctx.params` 应当包含 `{ id: "123" }`

#### Scenario: 提取多个路径参数

- **WHEN** 注册路由 `GET /org/:orgId/project/:projectId` 并请求 `GET /org/raven/project/routing`
- **THEN** 在 Handler 中，`ctx.params` 应当包含 `{ orgId: "raven", projectId: "routing" }`

### Requirement: 查询参数提取

路由系统 SHALL 在路由匹配阶段自动解析 URL 中的查询字符串，并将其提供在组装后的 `ctx.query` 中。在路由匹配前，这些数据不应通过 `RavenContext` 获取。

#### Scenario: 解析单个查询参数

- **WHEN** 发起请求 `GET /search?q=raven`
- **THEN** 在路由处理流程中，`ctx.query` 应当包含 `{ q: "raven" }`

### Requirement: 路由组

框架 SHALL 提供 `group` 方法，允许对路由进行逻辑分组并累加前缀。

#### Scenario: 路由前缀累加

- **WHEN** 在 `raven.group('/api', ...)` 中定义 `api.get('/v1', ...)`
- **THEN** 该路由应当匹配 `GET /api/v1`

### Requirement: App-level State Management

The system SHALL provide an `AppState<T>` class for managing state at the application (Raven instance) level.

#### Scenario: AppState isolation

- **WHEN** a value is set for an `AppState` on one Raven instance
- **THEN** it SHALL NOT be accessible from a different Raven instance

#### Scenario: AppState inheritance

- **WHEN** a value is not set for an `AppState` on a child Raven instance (e.g., created via `.group()`)
- **THEN** it SHALL resolve to the value set on its parent Raven instance

### Requirement: Request-level State Management

The system SHALL provide a `RequestState<T>` class for managing state at the individual request level.

#### Scenario: RequestState isolation

- **WHEN** a value is set for a `RequestState` within one request's scope
- **THEN** it SHALL NOT be accessible from concurrent or subsequent requests

### Requirement: Unified State Access (get/set)

Both `AppState` and `RequestState` SHALL provide `get()` and `set(value)` methods that automatically identify the current active scope using asynchronous context.

#### Scenario: Context-aware set

- **WHEN** `AppState.set(value)` is called within a Raven instance's execution context (e.g., during plugin registration)
- **THEN** the value SHALL be associated with that specific instance

#### Scenario: Context-aware get

- **WHEN** `State.get()` is called within an active scope
- **THEN** it SHALL return the value associated with that scope without requiring an explicit instance or scope object

### Requirement: Safe State Access

The system (SHALL) provide a `getOrFailed()` method on all `ScopedState` subclasses to ensure required states are initialized.

#### Scenario: Uninitialized state access

- **WHEN** `getOrFailed()` is called and the state has not been set in any accessible scope
- **THEN** it SHALL throw a `RavenError` with a clear message

### Requirement: Scoped State Creation

The system SHALL provide `AppState<T>` and `RequestState<T>` classes to create unique, type-safe state identifiers. 工厂函数采用对象参数风格，`name` 为可选属性。创建时可选地指定标准 JSON Schema 对象和数据源（Body/Query/Params/Header），使该状态具备作为 State Slot 的能力。

#### Scenario: Independent states

- **WHEN** two state identifiers are created with the same or different names
- **THEN** setting a value for one SHALL NOT affect the value of the other

#### Scenario: 创建带 Schema 的状态（对象参数）

- **WHEN** 调用 `createRequestState({ schema: { type: 'object', ... }, source: 'body' })`
- **THEN** 返回的 `RequestState` 实例应当携带 `schema` 和 `source` 元数据
- **AND** 该状态可以作为 Handler 的 Slot 使用

#### Scenario: 不提供 name 时自动生成

- **WHEN** 调用 `createRequestState({ source: 'body' })` 不传入 `name`
- **THEN** 返回的 `RequestState` 实例应当具有唯一的内部标识符
- **AND** 该状态依然可以正常使用

#### Scenario: 仅提供 name（保持原有简洁用法）

- **WHEN** 调用 `createRequestState({ name: 'myState' })` 只传入 `name`
- **THEN** 返回的 `RequestState` 实例的 `schema` 和 `source` 应当为 undefined
- **AND** 该状态的行为与之前完全一致

#### Scenario: 无参数调用

- **WHEN** 调用 `createRequestState()` 不传入任何参数
- **THEN** 返回的 `RequestState` 实例应当具有唯一的内部标识符
- **AND** 该状态可以正常用于存取数据

### Requirement: Static State Declaration

Developers SHALL declare `AppState` and `RequestState` instances as global constants (typically at the module level) to ensure consistent identity across asynchronous boundaries.

#### Scenario: Identity consistency

- **WHEN** a state identifier is declared once globally and used across different hooks/handlers
- **THEN** it SHALL resolve to the same underlying data within the same scope

### Requirement: Built-in State Naming Convention

Raven framework's built-in states SHALL use the `raven:` prefix for their names.

#### Scenario: Built-in states

- **WHEN** a built-in state like `RavenContext` is created
- **THEN** its name SHALL follow the pattern `raven:<feature>` (e.g., `raven:context`)
