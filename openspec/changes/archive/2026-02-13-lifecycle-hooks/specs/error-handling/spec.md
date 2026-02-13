## ADDED Requirements

### Requirement: 全局错误捕获与处理
框架 SHALL 捕获请求生命周期内（包括所有钩子和 Handler）抛出的任何异常，并将其传递给 `onError` 钩子。

#### Scenario: 捕获 Handler 中的错误
- **WHEN** 业务 Handler 抛出异常
- **THEN** 框架捕获该异常并调用已注册的 `onError` 钩子

#### Scenario: 捕获钩子中的错误
- **WHEN** 任何生命周期钩子（如 `onRequest`）抛出异常
- **THEN** 框架捕获该异常并调用已注册的 `onError` 钩子

### Requirement: onError 钩子响应转换
`onError` 钩子 MUST 返回一个 `Response` 对象作为最终结果。

#### Scenario: onError 返回自定义错误响应
- **WHEN** `onError` 钩子被调用并返回一个自定义的 `Response`
- **THEN** 客户端接收到该自定义响应
