## MODIFIED Requirements

### Requirement: 标准化错误识别

框架 SHALL 识别并处理 RavenError 实例。

#### Scenario: RavenError 类型识别

- **WHEN** 捕获到的错误是 RavenError 实例
- **THEN** 错误对象 SHALL 包含标准化的 `code`、`message`、`context`、`statusCode` 属性

#### Scenario: RavenError 响应构建

- **WHEN** 调用 `RavenError.toResponse()` 方法
- **THEN** 返回的 Response 对象 SHALL 使用 `statusCode` 属性作为 HTTP 状态码
- **AND** 若 `statusCode` 未设置则默认使用 500

## REMOVED Requirements

### Requirement: ErrorContext 包含 status 属性

**Reason**: status 已提升为 RavenError.statusCode 一级属性
**Migration**: 将 `error.context.status` 改为 `error.statusCode`
