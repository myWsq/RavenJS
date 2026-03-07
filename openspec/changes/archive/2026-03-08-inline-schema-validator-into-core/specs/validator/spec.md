## ADDED Requirements

### Requirement: Core 导出 Schema-Aware Handler 工具

`@raven.js/core` SHALL 提供 `withSchema(schemas, handler)` API，用于声明 body/query/params/headers 的 Standard Schema，并向业务 handler 传入对应的 typed context。

#### Scenario: 使用 body schema 生成 typed context

- **WHEN** 开发者从 `@raven.js/core` 导入 `withSchema`，并声明 `withSchema({ body: UserSchema }, (ctx) => ...)`
- **THEN** `ctx.body` SHALL 使用 `UserSchema` 的输出类型
- **AND** 业务 handler SHALL 直接接收到校验后的 body 值

#### Scenario: 仅声明部分 schema

- **WHEN** 开发者只声明 `body` 和 `query` schema
- **THEN** `ctx.body` 与 `ctx.query` SHALL 使用各自 schema 的输出值
- **AND** `ctx.params` 与 `ctx.headers` SHALL 直接使用当前请求状态中的值

### Requirement: Core 提供结构化校验错误

`@raven.js/core` SHALL 导出 `ValidationError` 与 `isValidationError`，用于表示和识别请求校验失败。

#### Scenario: 单一数据源校验失败

- **WHEN** body schema 校验失败
- **THEN** core SHALL 抛出 `ValidationError`
- **AND** 该错误的 `bodyIssues` SHALL 包含 body 的校验问题

#### Scenario: 多个数据源同时校验失败

- **WHEN** body 与 query schema 同时校验失败
- **THEN** core SHALL 抛出同一个 `ValidationError`
- **AND** 该错误 SHALL 分别保留 `bodyIssues` 与 `queryIssues`

### Requirement: SchemaClass 作为 Core 的类型推断工具

`@raven.js/core` SHALL 导出 `SchemaClass(shape)`，用于从 Standard Schema shape 生成仅承担类型推断职责的基类。

#### Scenario: 从 core 导入 SchemaClass

- **WHEN** 开发者从 `@raven.js/core` 导入 `SchemaClass` 并声明 `class User extends SchemaClass({ name: z.string() }) {}`
- **THEN** `User` 实例 SHALL 具备由 shape 推断出的字段类型
- **AND** `User._shape` 与实例上的 `_shape` SHALL 暴露原始 shape

#### Scenario: SchemaClass 不执行运行时校验

- **WHEN** 开发者使用不满足 schema 约束的值实例化 `SchemaClass` 派生类
- **THEN** `SchemaClass` 本身 SHALL 不执行运行时校验
- **AND** 该能力 SHALL 仅负责类型推断与 shape 复用

## MODIFIED Requirements

### Requirement: Schema 库无关性 (Schema Library Agnostic)

Core 层 SHALL 内建 Standard Schema 协议支持，但 SHALL 不依赖任何特定 Schema 验证库。开发者可以向 core 传入任意符合 Standard Schema 的 schema 实例。

#### Scenario: Core 无特定校验库依赖

- **WHEN** 检查 `@raven.js/core` 的 package.json
- **THEN** SHALL 不包含 Zod、Valibot、ArkType、Ajv 等特定校验库作为必需运行时依赖

#### Scenario: 使用 Standard Schema 兼容库

- **WHEN** 开发者向 `withSchema` 传入任意实现 Standard Schema 的 schema
- **THEN** core SHALL 调用该 schema 的 `~standard.validate` 方法
- **AND** SHALL 以其输出值作为请求校验结果

## REMOVED Requirements

### Requirement: Core 只做 State 赋值 (Core State Assignment Only)

**Reason**: 请求数据校验已并入 core，core 不再只是写入原始 State；对于声明 schema 的路由，core 会在请求生命周期内完成校验并写入校验后的状态值。

**Migration**: 不再假设 `BodyState`、`QueryState`、`ParamsState`、`HeadersState` 在 schema-aware 路由中始终保存原始输入；若需要访问原始请求，请从 `RavenContext.request` 自行读取。
