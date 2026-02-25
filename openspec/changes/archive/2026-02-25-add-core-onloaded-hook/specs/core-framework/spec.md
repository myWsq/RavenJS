## ADDED Requirements

### Requirement: onLoaded Hook Execution

框架 SHALL 支持注册 `onLoaded` hook，并在初始化流程中“所有插件加载完成后”触发该 hook 链。该 hook 属于 app-level 生命周期，不属于请求处理生命周期。

#### Scenario: 所有插件加载完成后触发 onLoaded
- **WHEN** 应用完成本次初始化流程中全部插件的注册与加载
- **THEN** 框架 MUST 按注册顺序执行所有 `onLoaded` hooks
- **AND** 每个 hook 执行时可访问完整的 `Raven` 实例

#### Scenario: onLoaded 支持异步执行
- **WHEN** 某个 `onLoaded` hook 返回 Promise
- **THEN** 框架 MUST 等待该 Promise 完成后再执行下一个 `onLoaded` hook

#### Scenario: onLoaded 抛错时中断并上抛
- **WHEN** 某个 `onLoaded` hook 抛出异常或返回 rejected Promise
- **THEN** 框架 MUST 停止后续 `onLoaded` hook 执行
- **AND** 将该错误向上传递给调用方，以阻止不完整初始化继续

#### Scenario: onLoaded 在同一次初始化中仅触发一次
- **WHEN** 初始化流程中完成插件加载并触发过 `onLoaded`
- **THEN** 框架 MUST 保证该初始化流程内 `onLoaded` 不被重复触发
