## ADDED Requirements

### Requirement: Contract Artifact Build 生成可分发的 Canonical Bundle

系统 SHALL 提供 standalone 的 contract artifact build 能力，从 backend raw `*.contract.ts` 提取 contract 定义并生成可序列化的 `Raven Contract Bundle`。该 bundle SHALL 作为跨项目消费、后续 client generation 与 OpenAPI emitter 的统一输入，且消费者 MUST NOT 依赖 backend 源码、`@raven.js/core` 或具体 schema 库运行时才能读取该产物。

#### Scenario: 从 backend raw contract 生成 canonical bundle

- **WHEN** 开发者对一个配置好的 contract package 执行 contract build，且目标 backend 中存在可分析的 `defineContract(...)` 导出
- **THEN** 系统 SHALL 在输出目录生成可序列化的 contract bundle 文件
- **AND** bundle SHALL 包含每个 contract 的稳定标识、HTTP method、path 以及请求/响应 schema 文档引用

#### Scenario: 消费者仅读取 artifact 而不依赖 backend 源码

- **WHEN** frontend 或 monorepo 外部项目加载生成后的 contract bundle
- **THEN** 它 SHALL 不需要导入 backend 的 raw contract 源文件
- **AND** 它 SHALL 不需要加载 `@raven.js/core` 或具体 schema runtime 才能读取 contract 文档内容

### Requirement: Contract Artifact Build 从同一份 Contract 语义输出 OpenAPI

系统 SHALL 基于同一份 extracted contract 语义输出 OpenAPI 产物，而不是从其它中间格式反推。OpenAPI 中的 request schema SHALL 使用 contract schema 的 input 语义；response schema SHALL 使用 contract schema 的 output 语义。

#### Scenario: 构建同时输出 OpenAPI JSON 与 YAML

- **WHEN** contract build 成功完成
- **THEN** 系统 SHALL 额外生成 `openapi.json`
- **AND** 系统 SHALL 额外生成 `openapi.yml`

#### Scenario: request/response 使用不同的 schema 方向

- **WHEN** contract 中的 schema 存在 input/output 不对称情况，例如 request `.default()` 或 response `.transform()`
- **THEN** OpenAPI 中的 request 文档 SHALL 反映调用方实际可提交的 input 形状
- **AND** OpenAPI 中的 response 文档 SHALL 反映客户端最终可观察到的 output 形状
