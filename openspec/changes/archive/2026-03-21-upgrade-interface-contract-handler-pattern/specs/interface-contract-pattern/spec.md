# interface-contract-pattern Specification

## Purpose

定义 RavenJS 官方 `interface` 层的 contract-first 默认模式，使每个接口以独立目录承载 `contract` 与 `handler`，并允许 frontend 直接复用 frontend-safe 的 contract value。

## ADDED Requirements

### Requirement: Interface Entrypoint 必须拆分为 contract 与 handler

RavenJS 官方 pattern 文档 SHALL 将每个 HTTP entrypoint 描述为 `interface/<entry>/<entry>.contract.ts` 与 `interface/<entry>/<entry>.handler.ts` 两文件模式。`<entry>.contract.ts` SHALL 成为 `method`、`path`、`schemas` 与 contract 相关类型推导的唯一来源；`<entry>.handler.ts` SHALL 只导出 `XxxHandler`，并通过 `withSchema(Contract.schemas, ...)` 绑定 transport schema 与业务编排。

#### Scenario: 新接口使用固定的两文件结构

- **WHEN** 文档展示一个新的 `create-order` 接口示例
- **THEN** 示例 SHALL 使用 `interface/create-order/create-order.contract.ts` 与 `interface/create-order/create-order.handler.ts`
- **AND** SHALL 不再把 `create-order.interface.ts` 作为默认推荐形态

#### Scenario: handler 依赖 contract 而不是反向耦合

- **WHEN** 文档展示 `handler.ts` 的推荐写法
- **THEN** `handler.ts` SHALL 通过 `withSchema(Contract.schemas, ...)` 读取 contract 中声明的 schema
- **AND** `contract.ts` SHALL 不依赖 `handler.ts` 或业务编排实现

### Requirement: Frontend 可以直接复用 Contract Value

RavenJS 官方文档 SHALL 推荐 frontend 直接 import contract value，而不是仅做 type-only import。该 contract value SHALL 公开可复用的 `method`、`path`、`schemas` 以及请求/响应类型推导；`contract.ts` 及其依赖树 MUST 保持 frontend-safe，并且 frontend 文档 MUST NOT 把 `handler.ts` 作为共享依赖入口。

#### Scenario: Frontend 直接导入 contract value

- **WHEN** frontend 需要发起 `create-order` 请求
- **THEN** 官方示例 SHALL 直接导入 `CreateOrderContract`
- **AND** SHALL 说明 frontend 可以复用 `CreateOrderContract.method`、`CreateOrderContract.path`、`CreateOrderContract.schemas` 与对应的请求/响应推导类型

#### Scenario: 共享依赖保持 frontend-safe

- **WHEN** backend 的 `contract.ts` 被 frontend 直接导入
- **THEN** `contract.ts` 的依赖树 SHALL 不依赖 `Raven`、`AppState`、`RequestState`、runtime dispatch 或其它服务端运行时模块
- **AND** 官方文档 SHALL 明确不推荐 frontend 直接依赖 `handler.ts`
