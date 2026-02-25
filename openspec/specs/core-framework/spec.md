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

### Requirement: Bun-only 运行时

Raven 框架 SHALL 定位为 Bun-only 框架。用户需使用 `Bun.serve({ fetch: (req) => app.handle(req) })` 启动 HTTP 服务。文档 SHALL 明确声明 RavenJS 仅支持 Bun 运行时。

#### Scenario: 在 Bun 下使用 Raven

- **WHEN** 用户需要启动 HTTP 服务
- **THEN** 用户 SHALL 使用 Bun 运行并调用 `Bun.serve({ fetch: (req) => app.handle(req), port, hostname })` 自行启动
- **AND** Raven 的 `handle` 方法作为 fetch 回调正常工作

#### Scenario: Bun-only 声明

- **WHEN** 用户在选择运行环境
- **THEN** 文档 SHALL 明确声明 RavenJS 仅支持 Bun
- **AND** 文档 SHALL 不提及 Node.js 或其它运行时的兼容性

### Requirement: Raven 作为逻辑层暴露 handle 方法

Raven 框架 SHALL 作为纯逻辑层，不包含 HTTP 服务器启动能力。Raven 类 SHALL 提供 `handle` 方法，接收 Web API 的 `Request`，返回 `Promise<Response>`，实现 FetchHandler 语义。

#### Scenario: handle 处理 Request 返回 Response

- **WHEN** 调用 `app.handle(request)` 且请求匹配已注册路由
- **THEN** 框架执行完整生命周期（onRequest、beforeHandle、Handler、beforeResponse）
- **AND** 返回 Web 标准 `Response` 对象

#### Scenario: handle 作为 Bun.serve 的 fetch 回调

- **WHEN** 用户需要在 Bun 下启动 HTTP 服务
- **THEN** 可将 `(req) => app.handle(req)` 作为 fetch 回调传入 `Bun.serve`（避免直接传 `app.handle` 导致 this 丢失）
- **AND** 例如 `Bun.serve({ fetch: (req) => app.handle(req) })` 即可启动 HTTP 服务

### Requirement: Raven handle 方法处理 HTTP 请求

Raven 框架 SHALL 通过 `handle` 方法处理传入的 HTTP 请求并返回响应。在请求处理过程中，必须按照定义的生命周期顺序执行已注册的钩子函数。

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

- **WHEN** 传入标准的 GET 请求且注册了所有类型的钩子
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

### Requirement: onLoaded Hook Execution

框架 SHALL 支持注册 `onLoaded` hook，并在初始化流程中“所有插件加载完成后”触发该 hook 链。该 hook 属于 app-level 生命周期，不属于请求处理生命周期。

#### Scenario: 所有插件加载完成后触发 onLoaded
- **WHEN** 应用完成本次初始化流程中全部插件的注册与加载
- **THEN** 框架 MUST 按注册顺序执行所有 `onLoaded` hooks
- **AND** 每个 hook 执行时可访问完整的 `Raven` 实例

#### Scenario: onLoaded 支持异步执行
- **WHEN** 某个 `onLoaded` hook 返回 Promise
- **THEN** 框架 MUST 等待该 Promise 完成后再执行下一个 `onLoaded` hook

#### Scenario: onLoaded 抛错时中断并上抛
- **WHEN** 某个 `onLoaded` hook 抛出异常或返回 rejected Promise
- **THEN** 框架 MUST 停止后续 `onLoaded` hook 执行
- **AND** 将该错误向上传递给调用方，以阻止不完整初始化继续

#### Scenario: onLoaded 在同一次初始化中仅触发一次
- **WHEN** 初始化流程中完成插件加载并触发过 `onLoaded`
- **THEN** 框架 MUST 保证该初始化流程内 `onLoaded` 不被重复触发

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

### Requirement: App-level State Management

The system SHALL provide an `AppState<T>` class for managing state at the application (Raven instance) level.

#### Scenario: AppState isolation

- **WHEN** a value is set for an `AppState` on one Raven instance
- **THEN** it SHALL NOT be accessible from a different Raven instance

#### Scenario: AppState scoped to current instance only

- **WHEN** `AppState.get()` is called within a Raven instance's execution context
- **THEN** it SHALL return only the value set on that specific instance
- **AND** it SHALL NOT resolve to any parent instance (parent chain is removed)

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
