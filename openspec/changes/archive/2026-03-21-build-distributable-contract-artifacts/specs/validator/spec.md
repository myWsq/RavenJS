## ADDED Requirements

### Requirement: Contract Artifact Generation 需要可序列化 Schema 表达

在 contract artifact generation 场景下，系统 SHALL 允许 contract schema 在现有 Standard Schema runtime validate 能力之外，额外提供可序列化的 JSON Schema 表达。该表达 SHALL 支持按方向 materialize：请求侧使用 schema input，响应侧使用 schema output。

#### Scenario: 可序列化 schema 参与 artifact generation

- **WHEN** `raven build-contract` 读取一个同时具备 Standard Schema 与可序列化 JSON Schema 能力的 contract schema
- **THEN** 系统 SHALL 使用该 schema 的 request input 文档生成 body/query/params/headers 的 artifact 文档
- **AND** 系统 SHALL 使用该 schema 的 response output 文档生成 response 的 artifact 文档

#### Scenario: schema 缺少可序列化能力时构建失败但 runtime 不受影响

- **WHEN** 开发者对一个仅实现 Standard Schema validate、但不能导出可序列化 JSON Schema 的 contract 执行 artifact build
- **THEN** `raven build-contract` SHALL 以可定位的构建错误失败
- **AND** 现有基于 `withSchema` 的 runtime validation 能力 SHALL 保持不变
