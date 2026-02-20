## MODIFIED Requirements

### Requirement: 自动数据注入与校验 (Auto Data Injection and Validation)
框架 MUST 在请求生命周期中自动激活声明的 Slots，并使用 Ajv 的 `ValidateFunction` 进行 JSON Schema 校验。Body 数据 SHALL 使用 `request.json()` 解析后再通过 validator 校验。

#### Scenario: 自动填充并验证 Body
- **WHEN** 路由 Handler 声明了一个带 `schema` 和 `source: 'body'` 的 State 作为 Slot
- **AND** 发起一个带有合法 JSON Body 的 POST 请求
- **THEN** 框架 SHALL 先使用 `request.json()` 解析请求体
- **AND** 然后使用 `ValidateFunction` 校验解析后的数据
- **AND** 在 Handler 执行前，该 State 应当被自动赋值为已校验的数据

#### Scenario: 自动填充 Query 参数
- **WHEN** 路由 Handler 声明了一个带 `schema` 和 `source: 'query'` 的 State 作为 Slot
- **AND** 发起一个带有查询参数的 GET 请求
- **THEN** 在 Handler 执行前，该 State 应当被自动赋值为已校验的数据

#### Scenario: Body 校验失败拦截
- **WHEN** 请求 Body 数据不符合 Slot 定义的 JSON Schema
- **THEN** 框架 SHALL 自动中断请求并返回 400 响应
- **AND** 响应体 SHALL 包含 Ajv ValidateFunction 校验错误的详细信息
- **AND** 不应执行 Handler 内部逻辑

#### Scenario: Body JSON 解析失败
- **WHEN** 请求 Body 不是有效的 JSON 格式
- **THEN** 框架 SHALL 自动中断请求并返回 400 响应
- **AND** 响应体 SHALL 包含 JSON 解析错误信息

## REMOVED Requirements

### Requirement: JTD Parser 用于 Body 解析
**Reason**: 基准测试表明 JTD Parser 在 Bun 运行时下比 JSON.parse + ValidateFunction 慢 3.9 倍，且与其他 schema 类型的验证方式不一致。
**Migration**: Body 验证自动改为使用 JSON.parse + ValidateFunction，无需用户代码变更。
