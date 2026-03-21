# runtime-openapi-export Specification

## Purpose

TBD - created by archiving change replace-build-contract-with-runtime-openapi-export. Update Purpose after archive.

## Requirements

### Requirement: App 可以暴露已注册 Contract Routes 的 OpenAPI 文档

`Raven` SHALL 提供 `app.exportOpenAPI(options?)` API，用于在 app 上暴露基于已注册 contract routes 生成的 OpenAPI 3.0 JSON 文档。该导出能力只覆盖通过 `registerContractRoute(app, contract, handler)` 注册到当前 app 的 routes，而 MUST NOT 自动包含普通 `app.get/post/...` routes。若未显式配置，导出端点默认路径 SHALL 为 `/openapi.json`，默认 `info` SHALL 为 `{ title: "Raven API", version: "1.0.0" }`；调用方 MAY 通过 options 自定义路径与 `info`。

#### Scenario: 使用默认路径暴露 OpenAPI

- **WHEN** 开发者调用 `app.exportOpenAPI()` 且 app 中已注册 contract route
- **THEN** app SHALL 在 `/openapi.json` 暴露一个 OpenAPI 3.0 JSON 文档
- **AND** 该文档的 `info.title` 与 `info.version` SHALL 分别使用默认值 `"Raven API"` 与 `"1.0.0"`

#### Scenario: 使用自定义路径与 info 暴露 OpenAPI

- **WHEN** 开发者调用 `app.exportOpenAPI({ path: "/internal/spec.json", info: { title: "Orders API", version: "2.1.0" } })`
- **THEN** app SHALL 在 `/internal/spec.json` 暴露 OpenAPI 文档
- **AND** 该文档的 `info` SHALL 使用调用方传入的 title 与 version

#### Scenario: 导出文档反映 ready 后实际注册的 contract routes

- **WHEN** 某些 contract routes 在 plugin `load()` 或 `onLoaded` 阶段才通过 `registerContractRoute(...)` 注册到 app
- **THEN** `app.exportOpenAPI(...)` 暴露的文档 SHALL 包含这些在 `ready()` 完成前注册成功的 contract routes
- **AND** 导出结果 SHALL 以当前 app 实际注册成功的 contract routes 为真相源

### Requirement: OpenAPI 导出必须复用 Contract 的 method、path 与 schema 语义

OpenAPI exporter SHALL 直接基于已注册 contract 的 `method`、`path` 与 `schemas` 生成文档，而不是从 handler 推断。对请求侧 `body/query/params/headers`，导出 SHALL 使用 schema input 方向；对 `response`，导出 SHALL 使用 schema output 方向。路径中的 `:param` SHALL 转换为 OpenAPI 的 `{param}` 形式。

#### Scenario: 请求参数与请求体使用 contract request schema

- **WHEN** 某个 contract 同时声明 `query`、`params` 与 `body`
- **THEN** OpenAPI 文档 SHALL 基于这些 contract schema 生成 `parameters` 与 `requestBody`
- **AND** `params` 中的 `:paramName` 路径段 SHALL 在导出后显示为 `{paramName}`

#### Scenario: 响应使用 contract response schema 的 output 语义

- **WHEN** 某个 contract 声明了 `response` schema
- **THEN** OpenAPI 文档 SHALL 为该 operation 生成 `200` 成功响应定义
- **AND** 响应体 schema SHALL 使用该 response schema 的 output 方向

### Requirement: 不可序列化 Contract 必须被跳过并给出 Warning

当 `app.exportOpenAPI(...)` 为某个 contract route 生成 OpenAPI operation 时，如果该 contract 的任一相关 schema 不满足 Standard JSON Schema，或 materialize 为 `openapi-3.0` target 时失败，系统 SHALL 跳过该 contract 对应的整个 operation，并给出 warning。该 warning MUST 包含至少 method、path 和失败原因。该行为 MUST NOT 影响普通 route 请求处理，也 MUST NOT 阻止其他可导出 operations 出现在 OpenAPI 文档中。

#### Scenario: 某个 contract 不满足 Standard JSON Schema 时跳过 operation

- **WHEN** 某个已注册 contract 的 schema 无法 materialize 为 OpenAPI schema
- **THEN** 该 contract 对应的 operation SHALL 不出现在导出的 OpenAPI 文档中
- **AND** 系统 SHALL 给出包含 method、path 与失败原因的 warning

#### Scenario: 不可导出 contract 不影响其他 operations

- **WHEN** 同一个 app 中同时存在可导出 contract 与不可导出 contract
- **THEN** OpenAPI 文档 SHALL 继续包含所有可成功导出的 operations
- **AND** app 的 `ready()` 与普通请求处理 SHALL 不因不可导出 contract 而失败
