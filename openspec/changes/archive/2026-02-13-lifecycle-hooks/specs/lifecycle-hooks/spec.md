## ADDED Requirements

### Requirement: onRequest 钩子执行

框架 SHALL 支持注册 `onRequest` 钩子，并在接收到请求后第一时间执行。

#### Scenario: 成功执行 onRequest 钩子

- **WHEN** 注册了 `onRequest` 钩子并接收到请求
- **THEN** 钩子函数被调用，且传入原始 `Request` 对象

#### Scenario: onRequest 钩子短路响应

- **WHEN** `onRequest` 钩子返回一个 `Response` 对象
- **THEN** 框架 SHALL 停止后续执行（不执行 beforeHandle 和 Handler）
- **AND** 直接进入响应阶段

### Requirement: beforeHandle 钩子执行

框架 SHALL 支持注册 `beforeHandle` 钩子，并在 `Context` 创建后、业务 Handler 执行前调用。

#### Scenario: 成功执行 beforeHandle 钩子

- **WHEN** 注册了 `beforeHandle` 钩子且请求已通过 `onRequest` 阶段
- **THEN** 钩子函数被调用

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
