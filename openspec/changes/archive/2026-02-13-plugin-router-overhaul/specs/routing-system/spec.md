## MODIFIED Requirements

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
