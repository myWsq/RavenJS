## MODIFIED Requirements

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
