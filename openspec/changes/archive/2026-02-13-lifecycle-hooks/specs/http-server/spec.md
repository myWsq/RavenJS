## MODIFIED Requirements

### Requirement: Server handles HTTP requests

The Raven framework SHALL process incoming HTTP requests and return responses. 在请求处理过程中，必须按照定义的生命周期顺序执行已注册的钩子函数。

#### Scenario: 生命周期钩子完整执行链
- **WHEN** 接收到一个标准的 GET 请求，且注册了所有类型的钩子
- **THEN** 执行顺序 MUST 为：onRequest -> (Context 创建) -> beforeHandle -> Handler -> beforeResponse
- **AND** 最终返回由钩子或 Handler 产生的 Response

#### Scenario: 处理过程中报错进入错误处理
- **WHEN** 在任何生命周期阶段（钩子或 Handler）发生错误
- **THEN** 框架 MUST 捕获该错误并调用 `onError` 钩子
- **AND** 返回由 `onError` 产生的 Response
