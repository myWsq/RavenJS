## ADDED Requirements

### Requirement: Handler 插槽声明 (Handler Slot Declaration)

开发者 SHALL 能够通过 `createHandler` 为处理器声明所需的 State Slots。

#### Scenario: 声明 Handler 依赖的 Slots

- **WHEN** 调用 `createHandler({ slots: [bodyState, queryState] }, handler)`
- **THEN** 返回的 Handler 应当携带该 Slot 列表作为元数据

### Requirement: 自动数据注入与校验 (Auto Data Injection and Validation)

框架 MUST 在请求生命周期中自动激活声明的 Slots，并使用 Ajv 进行 JSON Schema 校验。

#### Scenario: 自动填充并验证 Body

- **WHEN** 路由 Handler 声明了一个带 `schema` 和 `source: 'body'` 的 State 作为 Slot
- **AND** 发起一个带有合法 JSON Body 的 POST 请求
- **THEN** 在 Handler 执行前，该 State 应当被自动赋值为已校验的数据

#### Scenario: 自动填充 Query 参数

- **WHEN** 路由 Handler 声明了一个带 `schema` 和 `source: 'query'` 的 State 作为 Slot
- **AND** 发起一个带有查询参数的 GET 请求
- **THEN** 在 Handler 执行前，该 State 应当被自动赋值为已校验的数据

#### Scenario: 校验失败拦截

- **WHEN** 请求数据不符合 Slot 定义的 JSON Schema
- **THEN** 框架应当自动中断请求并返回 400 响应
- **AND** 响应体应当包含 Ajv 校验错误的详细信息
- **AND** 不应执行 Handler 内部逻辑

### Requirement: Schema 库无关性 (Schema Library Agnostic)

Core 层 SHALL 只依赖标准 JSON Schema 对象，不与任何特定的 Schema 生成库（TypeBox、Zod 等）绑定。

#### Scenario: 使用原生 JSON Schema

- **WHEN** 创建 State 时传入标准 JSON Schema 对象 `{ type: 'object', properties: { ... } }`
- **THEN** 框架应当能够正确使用 Ajv 进行校验

#### Scenario: 通过插件使用 TypeBox

- **WHEN** 用户安装 `@ravenjs/typebox` 插件并使用其提供的工厂函数
- **THEN** 应当获得完整的 TypeScript 类型推断能力
- **AND** 生成的 Schema 应当被 Core 正确识别和校验
