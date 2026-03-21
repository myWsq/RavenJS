# Validator Specification

> **Migration Note**: This spec consolidates following original spec:
>
> - `handler-schema-validation`

## Purpose

定义 RavenJS Core 内建的 Standard Schema 请求校验能力，以及与之配套的 handler 工具、错误模型和类型推断工具。

## Requirements

### Requirement: Core 导出 Schema-Aware Handler 工具

`@raven.js/core` SHALL 提供 `withSchema(schemas, handler)` API，用于声明 body/query/params/headers/response 的 Standard Schema，并向业务 handler 传入对应的 typed context。对于 `body`、`query`、`params`、`headers`，`ctx` SHALL 使用各自 schema 的输出类型；对于 `response`，若已声明，则业务 handler 的返回值类型 SHALL 为该 response schema 的输入类型，core 再负责把校验后的输出包装成 JSON `Response`。

#### Scenario: 使用 body schema 生成 typed context

- **WHEN** 开发者从 `@raven.js/core` 导入 `withSchema`，并声明 `withSchema({ body: UserSchema }, (ctx) => ...)`
- **THEN** `ctx.body` SHALL 使用 `UserSchema` 的输出类型
- **AND** 业务 handler SHALL 直接接收到校验后的 body 值

#### Scenario: 仅声明部分请求 schema

- **WHEN** 开发者只声明 `body` 和 `query` schema
- **THEN** `ctx.body` 与 `ctx.query` SHALL 使用各自 schema 的输出值
- **AND** `ctx.params` 与 `ctx.headers` SHALL 直接使用当前请求状态中的值

#### Scenario: 定义 response schema 时切换 handler 返回类型

- **WHEN** 开发者声明 `withSchema({ response: UserResponseSchema }, async () => ({ id: "1" }))`
- **THEN** 该业务 handler 的返回值类型 SHALL 为 `UserResponseSchema` 的输入类型
- **AND** core SHALL 使用 `UserResponseSchema` 的输出值作为最终 JSON 响应体

#### Scenario: 未定义 response schema 时保持 Response 返回

- **WHEN** 开发者未声明 `response` schema
- **THEN** schema-aware handler 的返回值类型 SHALL 保持为 `Response`
- **AND** 现有 `withSchema(..., (ctx) => new Response(...))` 用法 SHALL 保持兼容

### Requirement: Core 提供结构化校验错误

`@raven.js/core` SHALL 导出 `ValidationError` 与 `isValidationError`，用于表示和识别请求 schema 校验失败，以及 response schema mismatch 的结构化问题详情。

#### Scenario: 单一请求数据源校验失败

- **WHEN** body schema 校验失败
- **THEN** core SHALL 抛出 `ValidationError`
- **AND** 该错误的 `bodyIssues` SHALL 包含 body 的校验问题

#### Scenario: 多个请求数据源同时校验失败

- **WHEN** body 与 query schema 同时校验失败
- **THEN** core SHALL 抛出同一个 `ValidationError`
- **AND** 该错误 SHALL 分别保留 `bodyIssues` 与 `queryIssues`

#### Scenario: response schema 校验失败

- **WHEN** schema-aware handler 声明了 `response` schema，但返回值不满足该 schema
- **THEN** core SHALL 构造可被 `isValidationError()` 识别的 `ValidationError`
- **AND** 该错误的 `responseIssues` SHALL 包含 response 的校验问题
- **AND** 该错误 SHALL 传递给专门的 response validation hook，而不是默认抛入 `onError`

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

### Requirement: Schema 库无关性 (Schema Library Agnostic)

Core 层 SHALL 内建 Standard Schema 协议支持，但 SHALL 不依赖任何特定 Schema 验证库。开发者可以向 core 传入任意符合 Standard Schema 的 schema 实例，既可用于 `withSchema` 的请求/响应 schema，也可用于 `defineContract` 的 `body/query/params/headers/response` contract schema。

#### Scenario: Core 无特定校验库依赖

- **WHEN** 检查 `@ravenjs/core` 的 package.json
- **THEN** SHALL 不包含 Zod、Valibot、ArkType、Ajv 等特定校验库作为必需运行时依赖

#### Scenario: 使用 Standard Schema 兼容库定义 handler schema

- **WHEN** 开发者向 `withSchema` 传入任意实现 Standard Schema 的 body/query/params/headers/response schema
- **THEN** core SHALL 调用该 schema 的 `~standard.validate` 方法
- **AND** SHALL 在请求侧使用其输出值作为校验结果，或在响应侧使用其输出值作为 `Response.json(...)` 的 payload

#### Scenario: 使用 Standard Schema 兼容库定义 contract schema

- **WHEN** 开发者向 `defineContract` 传入任意实现 Standard Schema 的 body/query/params/headers/response schema
- **THEN** core SHALL 保留这些 schema 实例作为 contract value 的一部分
- **AND** contract 的请求/响应类型推导 SHALL 继续基于 Standard Schema 的 input/output 语义工作

### Requirement: Core 导出 Contract Definition 工具

`@raven.js/core` SHALL 提供 `defineContract({ method, path, schemas })`，用于定义可被 backend 与 frontend 共同复用的 transport contract。该 helper SHALL 保留 `method` 与 `path` 的字面量类型，并 SHALL 允许调用方在同一个 contract 中声明 `body`、`query`、`params`、`headers`、`response` 五类 Standard Schema。

如果 core 导出 contract 推导工具，则这些工具 MUST 满足以下语义：

- request 侧的 `body/query/params/headers` 推导使用各自 schema 的 input 类型
- response 侧的推导使用 `response` schema 的 output 类型

#### Scenario: request contract 类型读取 schema input

- **WHEN** 开发者定义一个带 `.default()` 或 `.transform()` 的 request schema，并将其放入 `defineContract(...schemas...)`
- **THEN** `InferContractBodyInput`、`InferContractQueryInput`、`InferContractParamsInput`、`InferContractHeadersInput` 等 request-side 推导 SHALL 读取对应 schema 的 input 类型
- **AND** 这些推导 SHALL 与 handler 侧 `withSchema(...)` 读取 schema output 的语义保持区分

#### Scenario: response contract 类型读取 schema output

- **WHEN** 开发者在 contract 中声明 `response` schema，且该 schema 的 output 与 input 不同
- **THEN** `InferContractResponseOutput<typeof Contract>` SHALL 使用该 response schema 的 output 类型
- **AND** 该类型 SHALL 与客户端最终可观察到的 JSON 响应形状保持一致

### Requirement: Contract Helper 依赖边界必须保持 Frontend-Safe

用于定义 contract 的 helper 模块 SHALL 只依赖 Standard Schema 抽象及 contract 自身的类型工具，而 MUST NOT 依赖 Raven runtime、state、hook、router、request dispatch 或 Node/Bun 专属运行时模块。

#### Scenario: Frontend 导入 backend contract value

- **WHEN** frontend 直接导入一个由 `defineContract(...)` 创建的 backend contract value
- **THEN** 其依赖树 SHALL 不要求加载 `Raven`、`node:async_hooks` 或其它服务端运行时代码
- **AND** frontend 可以仅通过该 contract value 完成 method/path/schemas 复用与请求/响应类型推导
