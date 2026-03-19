# Core Framework Specification

## ADDED Requirements

### Requirement: Contract-Aware Route Registration

core SHALL 提供 `registerContractRoute(app, contract, handler)` helper，用于根据 contract 中声明的 `method` 与 `path` 完成路由注册。该 helper MUST 根据 `contract.method` 自动调用 `app.get`、`app.post`、`app.put`、`app.delete` 或 `app.patch`，并 MUST NOT 要求开发者把 route registration 再包进 plugin、自动扫描器或其它隐藏装配层。

#### Scenario: 根据 contract method 自动选择路由注册方法

- **WHEN** 开发者定义 `CreateOrderContract.method = "POST"` 且调用 `registerContractRoute(app, CreateOrderContract, CreateOrderHandler)`
- **THEN** helper SHALL 使用 `app.post(CreateOrderContract.path, CreateOrderHandler)` 的等价行为完成注册
- **AND** 发起匹配该 `path` 的 `POST` 请求时 SHALL 命中对应 handler

#### Scenario: 通过 helper 注册的 schema-aware handler 保持原有生命周期行为

- **WHEN** 开发者使用 `withSchema(CreateOrderContract.schemas, handler)` 生成 `CreateOrderHandler`，并通过 `registerContractRoute` 注册
- **THEN** 该路由 SHALL 与直接调用 `app.get/post/put/delete/patch` 注册时一样保留请求 schema 校验、response schema 校验与 response fallback 语义
- **AND** `app.ts` SHALL 继续作为显式的 composition root 展示这些注册调用
