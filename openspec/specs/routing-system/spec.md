## ADDED Requirements

### Requirement: HTTP 方法注册 (HTTP Method Registration)
框架 SHALL 提供 `get`, `post`, `put`, `delete`, `patch` 等方法用于注册对应 HTTP 动作的路由。

#### Scenario: 成功注册并触发 GET 路由
- **WHEN** 调用 `raven.get('/test', handler)` 并发起 `GET /test` 请求
- **THEN** 对应的 `handler` 应当被调用

#### Scenario: 路由不匹配导致 404
- **WHEN** 注册了 `GET /test` 但发起 `GET /wrong` 请求
- **THEN** 框架应当返回 404 响应

### Requirement: 路径参数提取 (Path Parameter Extraction)
路由系统 SHALL 支持以 `:` 开头的路径参数，并将其提取到 `ctx.params` 中。

#### Scenario: 提取单个路径参数
- **WHEN** 注册路由 `GET /user/:id` 并请求 `GET /user/123`
- **THEN** `ctx.params` 应当包含 `{ id: "123" }`

#### Scenario: 提取多个路径参数
- **WHEN** 注册路由 `GET /org/:orgId/project/:projectId` 并请求 `GET /org/raven/project/routing`
- **THEN** `ctx.params` 应当包含 `{ orgId: "raven", projectId: "routing" }`

### Requirement: 查询参数提取 (Query Parameter Extraction)
路由系统 SHALL 自动解析 URL 中的查询字符串，并将其提供在 `ctx.query` 中。

#### Scenario: 解析单个查询参数
- **WHEN** 发起请求 `GET /search?q=raven`
- **THEN** `ctx.query` 应当包含 `{ q: "raven" }`

### Requirement: 路由组 (Route Groups)
框架 SHALL 提供 `group` 方法，允许对路由进行逻辑分组并累加前缀。

#### Scenario: 路由前缀累加
- **WHEN** 在 `raven.group('/api', ...)` 中定义 `api.get('/v1', ...)`
- **THEN** 该路由应当匹配 `GET /api/v1`
