# lifecycle-hooks Specification

## Purpose
该规范定义了 Raven 框架的请求生命周期钩子机制，允许在请求处理的不同阶段注入逻辑。

## Requirements

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

### Requirement: beforeResponse 钩子执行
框架 SHALL 支持注册 `beforeResponse` 钩子，在最终响应发送给客户端前调用，允许修改响应。

#### Scenario: 成功执行 beforeResponse 钩子
- **WHEN** Handler 或前置钩子产生响应后
- **THEN** `beforeResponse` 钩子被调用，且传入当前 `Response` 对象

#### Scenario: beforeResponse 钩子替换响应
- **WHEN** `beforeResponse` 钩子返回一个新的 `Response` 对象
- **THEN** 框架 SHALL 使用该新对象作为最终响应返回给客户端
