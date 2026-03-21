## 1. Schema 与 Contract Generation 边界

- [x] 1.1 在 `packages/core/schema` 中补充 contract artifact generation 所需的可序列化 JSON Schema 类型边界与工具定义，并保持现有 `StandardSchemaV1` runtime validate 语义不变
- [x] 1.2 在 `packages/core/contract` 中补充 raw contract 与 artifact-generation contract 的边界约束，明确 request 使用 schema input、response 使用 schema output 的 materialize 规则
- [x] 1.3 为可序列化 schema 场景补充单元测试，覆盖 request/response 方向差异与“缺少序列化能力时 build 失败、runtime 不受影响”的行为

## 2. Standalone Generator 与 CLI

- [x] 2.1 在 `packages/cli` 中新增 `raven build-contract` 命令、package-local 配置发现与输出目录处理逻辑
- [x] 2.2 基于 TypeScript compiler API 实现 contract extractor，静态扫描 backend `*.contract.ts` 并生成 canonical `raven-contract.json`
- [x] 2.3 基于同一份 extracted contract 语义实现 `openapi.json` 与 `openapi.yml` emitter，并输出可定位的构建诊断
- [x] 2.4 为 `raven build-contract --watch` 增加监听与增量重建行为

## 3. 集成验证与文档

- [x] 3.1 增加 contract package 场景的 CLI 集成测试，覆盖独立 package 构建、只读 backend source、bundle/OpenAPI 输出与 watch 模式
- [x] 3.2 为 monorepo 中的独立 contract package 结构补充最小示例与配置说明
- [x] 3.3 更新 README / GUIDE / pattern 文档，将跨项目 contract 消费的推荐路径从 direct import raw contract 调整为 artifact / OpenAPI 驱动
