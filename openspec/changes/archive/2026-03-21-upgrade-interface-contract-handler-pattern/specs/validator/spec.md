# Validator Specification

## ADDED Requirements

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

## MODIFIED Requirements

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
