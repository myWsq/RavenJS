## ADDED Requirements

### Requirement: HTTP 方法注册 (HTTP Method Registration)
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

### Requirement: 路径参数提取 (Path Parameter Extraction)
路由系统 SHALL 在路由匹配成功后提取路径参数，并将其提供在组装后的 `ctx.params` 中。在路由匹配前，`Context` 实例及其包含的 `params` 不可用。

#### Scenario: 提取单个路径参数
- **WHEN** 注册路由 `GET /user/:id` 并请求 `GET /user/123`
- **THEN** 在 Handler 或 `beforeHandle` 钩子中，`ctx.params` 应当包含 `{ id: "123" }`

#### Scenario: 提取多个路径参数
- **WHEN** 注册路由 `GET /org/:orgId/project/:projectId` 并请求 `GET /org/raven/project/routing`
- **THEN** 在 Handler 中，`ctx.params` 应当包含 `{ orgId: "raven", projectId: "routing" }`

### Requirement: 查询参数提取 (Query Parameter Extraction)
路由系统 SHALL 在路由匹配阶段自动解析 URL 中的查询字符串，并将其提供在组装后的 `ctx.query` 中。在路由匹配前，这些数据不应通过 `RavenContext` 获取。

#### Scenario: 解析单个查询参数
- **WHEN** 发起请求 `GET /search?q=raven`
- **THEN** 在路由处理流程中，`ctx.query` 应当包含 `{ q: "raven" }`

### Requirement: 路由组 (Route Groups)
框架 SHALL 提供 `group` 方法，允许对路由进行逻辑分组并累加前缀。

#### Scenario: 路由前缀累加
- **WHEN** 在 `raven.group('/api', ...)` 中定义 `api.get('/v1', ...)`
- **THEN** 该路由应当匹配 `GET /api/v1`
