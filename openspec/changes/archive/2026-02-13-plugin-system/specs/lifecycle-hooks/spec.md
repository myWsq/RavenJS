## MODIFIED Requirements

### Requirement: onRequest 钩子执行

框架 SHALL 支持注册 `onRequest` 钩子，并在接收到请求后第一时间执行。

#### Scenario: 成功执行 onRequest 钩子

- **WHEN** 注册了 `onRequest` 钩子并接收到请求
- **THEN** 钩子函数被调用，且传入原始 `Request` 对象

#### Scenario: onRequest 钩子短路响应

- **WHEN** `onRequest` 钩子返回一个 `Response` 对象
- **THEN** 框架 SHALL 停止后续执行（不执行 beforeHandle 和 Handler）
- **AND** 直接进入响应阶段

#### Scenario: 上下文作用域覆盖

- **WHEN** `onRequest` 钩子在异步上下文中执行
- **THEN** 该上下文 SHALL 在整个请求处理周期（包括所有后续钩子 and Handler）中保持可用

### Requirement: beforeHandle 钩子执行

框架 SHALL 支持注册 `beforeHandle` 钩子，并在 `Context` 创建后、业务 Handler 执行前调用。

#### Scenario: 成功执行 beforeHandle 钩子

- **WHEN** 注册了 `beforeHandle` 钩子且请求已通过 `onRequest` 阶段
- **THEN** 钩子函数被调用

#### Scenario: beforeHandle 钩子短路响应

- **WHEN** `beforeHandle` 钩子返回一个 `Response` 对象
- **THEN** 框架 SHALL 停止执行业务 Handler
- **AND** 直接进入响应阶段
