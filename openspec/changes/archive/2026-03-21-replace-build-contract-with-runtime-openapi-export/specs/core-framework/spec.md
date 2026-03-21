## ADDED Requirements

### Requirement: Contract Route 注册必须写入 App 级 Registry

当开发者调用 `registerContractRoute(app, contract, handler)` 时，框架 SHALL 不仅根据 `contract.method` 与 `contract.path` 完成 route 注册，还 MUST 把该 contract 记录到 app 级 route registry 中，使后续 runtime 功能可以读取“当前 app 实际注册成功的 contract routes”。

#### Scenario: registerContractRoute 将 contract 写入 app registry

- **WHEN** 开发者调用 `registerContractRoute(app, CreateOrderContract, CreateOrderHandler)`
- **THEN** app SHALL 成功注册对应的 HTTP route
- **AND** app 级 registry SHALL 同时保留 `CreateOrderContract` 的 method、path 与 schemas 元数据

### Requirement: Route 冲突必须在注册时显式失败

框架 MUST 在 route 注册阶段检查重复的 `method + path shape`。路径冲突判断 SHALL 以规范化后的 path shape 为准，而不是仅按原始 path 字符串比较；因此仅参数名不同但 shape 相同的路径也构成冲突。检测到冲突时，框架 MUST 抛出显式错误，而 MUST NOT 让后注册的 route 静默覆盖已有 route。

#### Scenario: 相同 method 与相同路径重复注册时报错

- **WHEN** app 已注册 `GET /orders/:id`，随后再次注册另一个 `GET /orders/:id`
- **THEN** 框架 MUST 在第二次注册时抛出冲突错误
- **AND** 已存在的 route MUST NOT 被静默覆盖

#### Scenario: 仅参数名不同但 path shape 相同也视为冲突

- **WHEN** app 已注册 `GET /orders/:id`，随后注册 `GET /orders/:orderId`
- **THEN** 框架 MUST 视这两个 route 为同一个 path shape 的冲突
- **AND** 第二次注册 MUST 失败并给出显式错误
