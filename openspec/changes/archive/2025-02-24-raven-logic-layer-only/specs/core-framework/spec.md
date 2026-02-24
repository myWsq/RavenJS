# Core Framework — Delta Spec (raven-logic-layer-only)

## ADDED Requirements

### Requirement: Raven 作为逻辑层暴露 handle 方法

Raven 框架 SHALL 作为纯逻辑层，不包含 HTTP 服务器启动能力。Raven 类 SHALL 提供 `handle` 方法，接收 Web API 的 `Request`，返回 `Promise<Response>`，实现 FetchHandler 语义。

#### Scenario: handle 处理 Request 返回 Response

- **WHEN** 调用 `app.handle(request)` 且请求匹配已注册路由
- **THEN** 框架执行完整生命周期（onRequest、beforeHandle、Handler、beforeResponse）
- **AND** 返回 Web 标准 `Response` 对象

#### Scenario: handle 可直接作为 FetchHandler 使用

- **WHEN** 用户需要将 Raven 接入任意 Fetch 兼容环境（如 Bun.serve、Deno.serve）
- **THEN** 可将 `app.handle` 直接作为 fetch 回调传入
- **AND** 例如 `Bun.serve({ fetch: app.handle })` 即可启动 HTTP 服务

## MODIFIED Requirements

### Requirement: 运行时抽象层

Raven 框架 SHALL 定位为与运行时解耦的逻辑层框架，与 HTTP 传输解耦。框架核心不依赖 `Bun.serve`，`handle` 可在任意 Fetch 兼容环境使用。用户需自行将 `app.handle` 接入所选传输环境（如 Bun.serve、Deno.serve、Node.js 18+、测试环境直接调用等）。文档 SHALL 说明 Bun.serve 仅为示例接入方式之一，并说明推荐运行环境为 Bun，Node 18+ 理论上可用。

#### Scenario: 在 Bun 下使用 Raven

- **WHEN** 用户在 Bun 环境下需要启动 HTTP 服务
- **THEN** 用户 SHALL 调用 `Bun.serve({ fetch: app.handle, port, hostname })` 等方式自行启动
- **AND** Raven 的 `handle` 方法作为 fetch 回调正常工作

#### Scenario: 推荐 Bun，Node 18+ 理论上可用

- **WHEN** 用户在选择运行环境
- **THEN** 文档 SHALL 推荐 Bun 作为首选
- **AND** 文档 SHALL 说明 Node.js 18+ 理论上可用（原生 fetch、Request/Response、AsyncLocalStorage）

### Requirement: Server handles HTTP requests

**FROM**: Server handles HTTP requests  
**TO**: Raven handle 方法处理 HTTP 请求

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

## REMOVED Requirements

### Requirement: Server can be started with configuration

**Reason**: Raven 重构为纯逻辑层，不再提供 `listen()` 或任何 HTTP 服务器启动能力。

**Migration**: 使用 `Bun.serve({ fetch: app.handle, port: 3000, hostname: '0.0.0.0' })` 等方式自行启动服务器；或直接将 `app.handle` 接入其他 Fetch 兼容环境。

### Requirement: Server can be stopped

**Reason**: Raven 不再拥有服务器实例，故不再提供 `stop()` 方法。

**Migration**: 若使用 `Bun.serve`，通过其返回的 `server.stop()` 停止服务；其他环境按各自 API 处理。
