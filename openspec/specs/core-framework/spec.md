# Core Framework Specification

> **Migration Note**: This spec consolidates the following original specs:
>
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

RavenJS SHALL be positioned as an Agent teaching tool rather than a traditional npm framework. The framework code SHALL be provided as conceptually organized reference implementation for Agents to learn from, not as a dependency to import. 对 `core` 而言，源码结构 MUST 优先服务于 Agent 的学习、定位与局部修改，而不是优先保留历史文件形态。

#### Scenario: Agent learns from RavenJS code

- **WHEN** an Agent reads the RavenJS reference code and README.md
- **THEN** the Agent SHALL understand how to write code in RavenJS's style
- **AND** the Agent SHALL be able to generate similar code without requiring RavenJS as a dependency

#### Scenario: Agent locates core concepts from source layout

- **WHEN** an Agent needs to understand request lifecycle, state, schema, routing, or plugin-related behavior in `modules/core`
- **THEN** the source layout SHALL allow the Agent to locate the relevant concept through directory and file boundaries
- **AND** the Agent SHALL NOT need to first read a single monolithic implementation file to identify ownership

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

Raven 框架 SHALL 通过 `handle` 方法处理传入的 HTTP 请求并返回响应。在请求处理过程中，必须按照定义的生命周期顺序执行已注册的钩子函数；对于 schema-aware handler，schema 校验与校验后 State 写入 MUST 发生在 `beforeHandle` 之前。

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

- **WHEN** 传入标准的 GET 请求且注册了所有类型的钩子，并且匹配到 schema-aware handler
- **THEN** 执行顺序 MUST 为：onRequest -> (Context 创建) -> processStates（含 schema 校验与 State 写入） -> beforeHandle -> Handler -> beforeResponse
- **AND** 最终返回由钩子或 Handler 产生的 Response

#### Scenario: 处理过程中报错进入错误处理

- **WHEN** 在任何生命周期阶段（钩子、schema 校验或 Handler）发生错误
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

框架 SHALL 提供 `get`, `post`, `put`, `delete`, `patch` 等方法用于注册对应 HTTP 动作的路由。`handler` 可以是一个简单的零参数函数，也可以是由 `withSchema` 返回的 schema-aware handler 描述。

#### Scenario: 成功注册并触发 GET 路由

- **WHEN** 调用 `raven.get('/test', handler)` 并发起 `GET /test` 请求
- **THEN** 对应的 `handler` 应当被调用

#### Scenario: 路由不匹配导致 404

- **WHEN** 注册了 `GET /test` 但发起 `GET /wrong` 请求
- **THEN** 框架应当返回 404 响应

#### Scenario: 注册 schema-aware handler

- **WHEN** 定义 `const h = withSchema({ body: UserSchema }, (ctx) => new Response(ctx.body.name))` 并调用 `raven.post('/api', h)`
- **THEN** 路由系统 SHALL 正确存储该 handler 关联的 schemas
- **AND** 在请求处理时 SHALL 基于这些 schemas 完成校验后再执行业务 handler

### Requirement: Schema-Aware Handler 在核心生命周期中执行校验

对于通过 `withSchema` 声明的路由，core SHALL 在 `beforeHandle` 执行前完成 body/query/params/headers 的 schema 校验，并将校验输出写入对应的内建 State。

#### Scenario: beforeHandle 读取校验后的状态值

- **WHEN** 某个路由通过 `withSchema({ query: QuerySchema }, handler)` 声明 query schema，且 `QuerySchema` 会将字符串转换为其他输出类型
- **THEN** `beforeHandle` 钩子中读取到的 `QueryState` SHALL 为 `QuerySchema` 的输出值
- **AND** 业务 handler 接收到的 `ctx.query` SHALL 与该状态值一致

#### Scenario: 校验失败阻断 beforeHandle 和 handler

- **WHEN** 声明 schema 的路由在请求进入后校验失败
- **THEN** core SHALL 在执行 `beforeHandle` 和业务 handler 之前抛出 `ValidationError`
- **AND** 请求 SHALL 进入统一 `onError` 处理流程

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

系统 SHALL 提供 `AppState<T>` 类用于管理应用（Raven 实例）级别的状态。`AppState` 的存储结构为 `Map<ScopeKey, Map<symbol, any>>`（双层 Map），不同 Scope 下的同一 `AppState` 实例持有独立的值。

#### Scenario: AppState Scope isolation

- **WHEN** 同一 `AppState` 实例在 `'S1'` 和 `'S2'` 两个 Scope 下分别被 setter 写入不同值
- **THEN** `AppState.in('S1').get()` 和 `AppState.in('S2').get()` SHALL 各自返回对应 Scope 的值

#### Scenario: AppState isolation between Raven instances

- **WHEN** 同一 `AppState` 在两个不同 Raven 实例各自的 GLOBAL Scope 下写入不同值
- **THEN** 两个实例的 `AppState.get()` SHALL 各自返回对应实例的值，互不影响

### Requirement: Request-level State Management

系统 SHALL 提供 `RequestState<T>` 类用于管理单次 HTTP 请求级别的状态。`RequestState` 的请求级存储结构为 `Map<ScopeKey, Map<symbol, any>>`（双层 Map），同一请求内不同 Scope 下的同一 `RequestState` 持有独立的值，不同请求之间完全隔离。

#### Scenario: RequestState Scope isolation within a request

- **WHEN** 同一请求中，`'S1'` Scope 的 hook 和 `'S2'` Scope 的 hook 分别写入同一 `RequestState`
- **THEN** `RequestState.in('S1').get()` 和 `RequestState.in('S2').get()` SHALL 各自返回对应 Scope 的值

#### Scenario: RequestState isolation between concurrent requests

- **WHEN** 多个并发请求同时通过各自的 setter 写入同一 `RequestState`（相同 Scope）
- **THEN** 每个请求的 `RequestState.get()` SHALL 仅返回自身请求内写入的值

### Requirement: Unified State Access (get/set)

`AppState` 和 `RequestState` SHALL 提供 `get()` 方法，通过异步上下文自动识别当前活跃的 Raven 实例（AppState）或请求（RequestState）。`get()` 始终从 GLOBAL_SCOPE 读取，等价于 `State.in(GLOBAL_SCOPE).get()`。`set(value)` 方法 SHALL 从 `ScopedState` 公共接口中移除；写入必须通过 `StateSetter` 完成。

#### Scenario: Context-aware get（GLOBAL Scope）

- **WHEN** `AppState.get()` 在活跃的 Raven 实例上下文中调用
- **THEN** SHALL 返回该实例 GLOBAL Scope 下为该 State 设置的值

#### Scenario: RequestState context-aware get（GLOBAL Scope）

- **WHEN** `RequestState.get()` 在活跃的请求上下文中调用
- **THEN** SHALL 返回当前请求 GLOBAL Scope 下为该 State 设置的值

### Requirement: Scope-pinned State View via `in()`

`ScopedState<T>` SHALL 提供 `in(scopeKey: string | symbol): ScopedState<T>` 方法，返回一个绑定到指定 Scope 的视图对象。视图对象提供与 `ScopedState` 相同的 `get()` 和 `getOrFailed()` 接口，但始终从指定 Scope 读取数据，不依赖任何隐式上下文。

同一 `ScopedState` 实例以相同 `scopeKey` 多次调用 `in()` MUST 返回同一对象（引用相等）。

在视图对象上再次调用 `in(otherKey)` SHALL 等价于在原始 State 上调用 `in(otherKey)`，即 `State.in("S1").in("S2") === State.in("S2")`。

#### Scenario: 读取具名 Scope 的 AppState

- **WHEN** `await app.register(sqlPlugin, 'S1')` 完成后，在任意上下文调用 `DBState.in('S1').get()`
- **THEN** SHALL 返回 `sqlPlugin` 在 `'S1'` Scope 下写入的值

#### Scenario: 读取具名 Scope 的 RequestState

- **WHEN** `await app.register(sqlPlugin, 'S1')` 完成后，在请求处理上下文调用 `TxState.in('S1').get()`
- **THEN** SHALL 返回该请求中 `sqlPlugin@S1` 的 hook 通过 setter 写入的值

#### Scenario: in() 引用相等性

- **WHEN** 对同一 State 实例以相同 key 两次调用 `in()`
- **THEN** `DBState.in('S1') === DBState.in('S1')` MUST 为 `true`

#### Scenario: in() 链式重置 Scope

- **WHEN** 调用 `DBState.in('S1').in('S2')`
- **THEN** 返回值 MUST 与 `DBState.in('S2')` 引用相等

### Requirement: StateSetter 作为唯一写入途径

`ScopedState` 子类 SHALL 不再对外暴露 `set()` 方法。State 的写入 MUST 通过框架在 `plugin.load()` 第二个参数提供的 `StateSetter` 函数完成。

`StateSetter = <T>(state: ScopedState<T>, value: T) => void` 是一个 scope 绑定函数，持有注册时指定的 scopeKey。无论该函数被传递到何处（包括 hook 闭包），其写入的 Scope 始终固定。

#### Scenario: 通过 setter 写入 AppState

- **WHEN** 在 `load(app, set)` 中调用 `set(DBState, db)`
- **THEN** `DBState` 在当前 Scope 下的值 SHALL 立即为 `db`

#### Scenario: 通过 setter 写入 RequestState（在 hook 中）

- **WHEN** 在 `load(app, set)` 中注册 `app.beforeHandle(() => set(TxState, tx))`，且请求到达
- **THEN** 该请求中 `TxState.in(scopeKey).get()` SHALL 返回 `tx`

#### Scenario: setter 在 hook 闭包中保持 Scope 绑定

- **WHEN** 同一插件注册到 `'S1'` 和 `'S2'` 两个 Scope，各自的 hook 通过对应 setter 写入 `TxState`
- **THEN** `TxState.in('S1').get()` 和 `TxState.in('S2').get()` SHALL 返回各自独立的值

### Requirement: Plugin Scope Registration

`Raven.register(plugin, scopeKey?)` 中指定的 `scopeKey` SHALL 决定该次注册的 `StateSetter` 写入哪个 Scope。未指定 `scopeKey` 时，使用框架内部 `GLOBAL_SCOPE`（`Symbol('raven:global')`），对应 `State.get()`（无 `.in()`）的默认读取范围。

#### Scenario: 无 scopeKey 时 setter 写入 GLOBAL Scope

- **WHEN** `await app.register(plugin)`（无 scopeKey），`load` 中调用 `set(DBState, db)`
- **THEN** `DBState.get()` SHALL 返回 `db`

#### Scenario: 有 scopeKey 时 setter 写入具名 Scope

- **WHEN** `await app.register(plugin, 'S1')`，`load` 中调用 `set(DBState, db)`
- **THEN** `DBState.get()` SHALL 返回 `undefined`（global 未写入）
- **AND** `DBState.in('S1').get()` SHALL 返回 `db`

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
