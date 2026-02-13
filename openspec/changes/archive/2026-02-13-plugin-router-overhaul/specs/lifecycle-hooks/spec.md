## MODIFIED Requirements

### Requirement: onRequest 钩子执行
框架 SHALL 支持注册 `onRequest` 钩子，并在接收到请求后第一时间执行。
在 `onRequest` 钩子执行期间，`Context` 尚未组装（不包含 `params` 和 `query`）。路由匹配及 `Context` 的组装必须在该钩子执行完成后进行。此阶段仅允许访问原始 `Request` 对象。

#### Scenario: 成功执行 onRequest 钩子
- **WHEN** 注册了 `onRequest` 钩子并接收到请求
- **THEN** 钩子函数被调用，且传入原始 `Request` 对象
- **AND** 此时尝试获取 `RavenContext` 应当为空或返回基础上下文（不含路由数据）

### Requirement: beforeHandle 钩子执行
框架 SHALL 支持注册 `beforeHandle` 钩子，并在 `Context` 完全创建后、业务 Handler 执行前调用。
`Context` 的完全创建（包含从路由匹配中提取的 `params` 和 `query`）发生在 `onRequest` 钩子执行之后且路由匹配成功之后。

#### Scenario: 成功执行 beforeHandle 钩子
- **WHEN** 注册了 `beforeHandle` 钩子且请求已通过 `onRequest` 阶段并完成路由匹配
- **THEN** 钩子函数被调用
- **AND** 此时 `ctx.params` 和 `ctx.query` 应当已经完全可用
