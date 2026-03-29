## Why

当前 RavenJS 推荐 frontend 直接导入 backend `contract` value，但该 value 会保留真实 schema 实例与依赖树，导致 backend contract 被迫维持 frontend-safe 边界。这既限制了后端自由使用 schema/DTO 组织方式，也不适合 monorepo 外部项目按产物分发与消费 contract。

与此同时，frontend 与外部消费者真正需要的是一个可分发、可序列化、可进一步生成客户端代码或接口文档的 contract artifact，而不是直接依赖 backend 源码。现在需要把 raw contract 与 distributable artifact 明确分层，并为其提供正式的构建入口。

## What Changes

- 新增 standalone 的 contract artifact 构建流程，从 backend `*.contract.ts` 提取 contract 信息并生成可分发产物，而不是让 frontend 直接导入 raw contract。
- 新增 canonical 的可序列化 contract artifact 产物，用于承载方法、路径、请求/响应 schema 语义以及后续客户端生成输入。
- 新增 OpenAPI 产物线，使同一份 contract artifact 能同时输出 `openapi.json` / `openapi.yml` 供 monorepo 外或跨语言场景消费。
- 新增 `raven build-contract` CLI 命令与配置约定，使独立的 contract package 可以在 monorepo 中或 monorepo 外作为分发边界使用。
- 调整 contract generation 对 schema 的要求：运行时校验继续基于 Standard Schema，而可分发 artifact / OpenAPI 生成场景需要可序列化的 JSON Schema 表达能力。
- 明确 frontend 的推荐消费路径从“直接 import backend raw contract”切换为“消费生成后的 artifact 或基于 artifact 生成 client”。

## Capabilities

### New Capabilities

- `contract-artifact-build`: 定义从 backend raw contract 生成可分发 contract artifact 与 OpenAPI 产物的 standalone 构建能力。

### Modified Capabilities

- `cli-tool`: 增加 `raven build-contract` 命令、配置发现、输出目录与 watch/build 行为的要求。
- `validator`: 扩展 contract schema 在 artifact generation 场景下的要求，使其除运行时 Standard Schema 校验外，还能提供可序列化的 JSON Schema 表达用于构建与分发。

## Impact

- 受影响代码：`packages/cli`、`packages/core/contract`、`packages/core/schema` 及相关测试与文档。
- 受影响 API：新增 `raven build-contract` CLI 接口；contract 生成链路将区分 raw contract 与 distributable artifact。
- 受影响系统：monorepo 内 contract package 分发、monorepo 外 contract artifact 消费、OpenAPI 输出与后续 client generation。
- 依赖与兼容性：runtime 校验能力保持 Standard Schema；artifact generation 需要引入或适配 Standard JSON Schema 能力，但不应让最终分发产物携带运行时依赖。
