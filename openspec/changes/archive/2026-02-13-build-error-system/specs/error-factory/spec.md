# error-factory Specification

## ADDED Requirements

### Requirement: RavenError 静态错误创建方法

框架 SHALL 在 `RavenError` 类上提供静态方法用于创建各类错误。

#### Scenario: 创建服务器已运行错误

- **WHEN** 调用 `RavenError.ERR_SERVER_ALREADY_RUNNING()`
- **THEN** 返回 SHALL 是 code 为 "ERR_SERVER_ALREADY_RUNNING"、message 为 "Server is already running" 的 RavenError

#### Scenario: 创建 Scoped Token 未初始化错误

- **WHEN** 调用 `RavenError.ERR_SCOPED_TOKEN_NOT_INITIALIZED("myToken")`
- **THEN** 返回 SHALL 是 code 为 "ERR_SCOPED_TOKEN_NOT_INITIALIZED"、message 为 "Scope is not initialized. Cannot access scoped token: myToken" 的 RavenError

### Requirement: setContext 方法

RavenError 实例 SHALL 提供 `setContext` 方法用于后续添加上下文数据。

#### Scenario: 设置错误上下文

- **WHEN** 创建错误后调用 `error.setContext({ requestId: "123" })`
- **THEN** 错误的 context 属性 SHALL 包含新增的上下文数据
