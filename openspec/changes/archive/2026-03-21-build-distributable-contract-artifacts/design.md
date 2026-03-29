## Context

当前 RavenJS 的 contract-first 模式把 frontend 直接导入 backend raw contract 作为默认推荐路径。该模式在 monorepo 内部短期可行，但会把真实 schema 实例、DTO shape 与 backend 依赖树一并暴露给 frontend，导致：

1. backend contract 必须保持 frontend-safe，限制了后端对 schema、DTO 和模块边界的自由组织；
2. monorepo 外部项目难以稳定消费这套 contract，因为它们无法也不应直接依赖 backend 源码；
3. 未来若要生成类型安全 client、OpenAPI、SDK 或跨语言接口定义，缺少一个可序列化、可分发的 canonical artifact。

另一方面，RavenJS 当前 contract 抽象只要求 `StandardSchemaV1`，该抽象足以支撑 runtime validate 和 input/output 类型推导，但不提供通用 schema introspection，因此不能稳定直接生成 OpenAPI 或可分发 schema 文档。要解决这个问题，需要把“raw contract 用于 backend runtime”与“artifact 用于分发和生成”拆成两个层次。

本次变更是跨 `packages/core`、`packages/cli`、OpenSpec 规范以及未来消费方式的架构升级，适合先用 design 固定关键决策。

## Goals / Non-Goals

**Goals:**

- 为 backend raw contract 提供 standalone 的 artifact 构建流程，不再要求 frontend 直接导入 backend 源码。
- 定义一个 canonical 的可序列化 contract bundle，作为 monorepo 内外分发、client generation 与 OpenAPI 输出的统一输入。
- 提供 `raven build-contract` CLI 命令，使独立 contract package 可以作为输出边界运行构建。
- 在 contract generation 场景下引入 Standard JSON Schema 能力，以便稳定产出 JSON bundle 与 OpenAPI。
- 明确 request schema 在 artifact 中使用 input 语义，response schema 使用 output 语义，与现有 contract 推导规则保持一致。
- 保持最终分发产物无运行时依赖，不要求消费者安装 `@raven.js/core` 或具体 schema 库。

**Non-Goals:**

- 不在本次变更中实现最终 frontend `generate-client` 命令或完整 SDK 生成器。
- 不把 OpenAPI 作为唯一 canonical contract 载体。
- 不在主构建进程中直接复用 backend contract 的模块缓存或依赖长期驻留的 runtime side effect。
- 不改变 `withSchema` 的 runtime validate 行为。
- 不要求所有现有 contract 立刻迁移；只在 artifact generation 场景下施加新的可序列化要求。

## Decisions

### 决策 1：将 canonical 分发载体定义为 `Raven Contract Bundle`，而不是 TypeScript 子包或 OpenAPI

**选择**：`raven build-contract` 的核心产物是一个 JSON 格式的 `Raven Contract Bundle`。该 bundle 记录 contract 列表、方法、路径、请求/响应方向化后的 schema 文档、稳定的 contract 标识与生成元数据。OpenAPI 与未来的 TS client 均从该 bundle 派生，而不是互相反推。

建议的输出关系为：

```text
backend raw contracts
  -> extractor + schema lowering
  -> dist/raven-contract.json
       |-- emitter: dist/openapi.json
       `-- emitter: dist/openapi.yml
```

**原因**：

- TypeScript 子包适合 monorepo 内消费，但不适合作为 monorepo 外的通用分发载体。
- OpenAPI 对生态兼容友好，但无法天然承载 Raven 特有的 contract 语义与未来扩展字段，不适合作为唯一真相源。
- JSON bundle 最适合做无依赖、可版本化、可序列化、可被后续生成器和外部系统共同消费的基础载体。

**备选方案**：

- 以 dep-free TypeScript 包作为唯一 canonical 产物
- 只输出 OpenAPI，不保留 Raven 自己的 contract bundle

**否决理由**：

- TypeScript 包会把分发路径绑定到 TS/Node/Bun 工具链，不利于跨语言或 monorepo 外消费。
- 只保留 OpenAPI 会让 Raven 的 contract 语义反向受制于 OpenAPI 表达能力，也不利于未来生成专用 client。

### 决策 2：artifact generation 与 runtime validation 分离，schema 采用 `Standard Schema + Standard JSON Schema` 双层能力

**选择**：runtime validation 继续基于现有 `StandardSchemaV1`；artifact generation 则要求 contract schema 还具备 Standard JSON Schema 能力，能够输出面向 request input 与 response output 的可序列化 schema 文档。

在概念上，artifact generation 读取的是：

```ts
StandardSchemaV1<Input, Output> & StandardJSONSchemaV1<Input, Output>;
```

但 Raven runtime 本身不因此放弃 `StandardSchemaV1`。

**原因**：

- 现有 `StandardSchemaV1` 只提供 validate 与 input/output 类型语义，不提供稳定的 schema introspection。
- OpenAPI、JSON artifact、外部 client generation 都需要可序列化 schema 表达。
- 将 artifact generation 的约束与 runtime validation 分开，可以避免把 core runtime 无谓地绑定到文档生成需求。

**备选方案**：

- 继续只依赖 `StandardSchemaV1`，在 build 阶段尝试从具体 schema vendor 猜测结构
- 将 core contract 整体切换为只接受 Standard JSON Schema
- 自定义一套 Raven 私有 schema AST 并要求所有 contract 全量迁移

**否决理由**：

- 仅依赖 `StandardSchemaV1` 无法提供规范级、稳定的 schema 序列化保证。
- 只接受 Standard JSON Schema 会损失 runtime validation 的现有抽象与兼容性。
- 私有 AST 过重，会把本次“建立构建与分发基础设施”的目标扩大成新的 schema 平台。

### 决策 3：生成器采用 standalone pipeline，基于 TypeScript compiler API 做发现，并用独立子进程完成 schema materialization

**选择**：`raven build-contract` 采用 standalone generator。CLI 在 contract package 下读取配置，使用 TypeScript compiler API 构建 `Program` / `TypeChecker`，静态扫描 backend `*.contract.ts`，提取 contract 文件、导出名与元数据边界；随后在独立、短生命周期的子进程中 fresh import 这些 raw contract，以拿到真实 schema 对象并完成 Standard JSON Schema materialization，最后生成 bundle 与 OpenAPI 产物。

**原因**：

- 这类任务需要语法树与类型系统共同参与，TS compiler API 是发现 contract 边界与导出入口的最直接基础设施。
- Standard JSON Schema 转换依赖真实 schema 对象，仅靠静态类型信息无法 materialize 出 JSON Schema，因此需要一个受控的运行时步骤。
- 将 materialization 放进独立子进程，可以避免主构建进程持有模块缓存，并让 watch 模式下的重复构建拿到 fresh contract 值。
- standalone generator 仍不依赖 frontend bundler，也不要求消费者使用 Bun plugin 或特定打包器。

**备选方案**：

- 用 Bun plugin 在构建 frontend 时动态生成 contract 模块
- 在主进程中直接 import/执行 backend contract 模块，再依赖同一模块缓存重复构建

**否决理由**：

- Bun plugin 适合 bundler 集成，但不适合作为可分发 artifact 的 source-of-truth build pipeline。
- 在主进程中直接复用模块缓存会让 watch 模式难以稳定拿到变更后的 contract 值，并放大副作用与缓存污染问题。

### 决策 4：`raven build-contract` 运行于独立 contract package，并通过 package-local 配置定位 backend contract source

**选择**：推荐在 monorepo 中建立独立的 contract package（例如 `backend-contract`），在该包目录内运行 `raven build-contract`。命令通过 package-local 配置文件发现：

- backend 项目的 `tsconfig`
- contract 源文件 glob
- 输出目录
- 是否输出 OpenAPI JSON / YAML

CLI 将当前包视为 artifact 边界，而不是直接向 backend 项目目录写产物。

**原因**：

- 这让“分发边界”从约定升级为 package 级隔离，frontend 或外部消费者只接触 contract artifact。
- contract package 可以独立发布、缓存、watch、版本化，而不污染 backend source tree。
- 这也兼容 monorepo 内外两种消费路径：workspace 依赖或发布后的 package/file artifact。

**备选方案**：

- 在 backend 项目内直接生成 `generated/contracts/*`
- 使用 frontend 项目反向读取 backend 配置和源文件

**否决理由**：

- 直接写回 backend source tree 会混淆 authoring truth 与 distributable artifact。
- 让 frontend 反向读取 backend 会再次制造源码耦合，不符合分发目标。

### 决策 5：artifact 中 request 使用 schema input，response 使用 schema output；OpenAPI 与 bundle 均遵循同一方向

**选择**：生成器在 materialize schema 时遵循当前 contract 语义：

- `body/query/params/headers` 使用 schema input
- `response` 使用 schema output

bundle 与 OpenAPI 都沿用这套方向，不复用 handler 侧的类型方向。

**原因**：

- contract 表达的是调用方可发送的输入与最终可观察到的输出，而不是 backend handler 内部拿到的已校验值。
- 这与现有 `InferContract*` 规则一致，可避免 `.transform()`、`.default()` 等场景下的语义漂移。
- 一旦 canonical bundle 明确这组方向，未来 client generation 就不需要再次发明语义映射。

**备选方案**：

- 直接复用 `withSchema` 视角：request 看 output，response 看 input
- 不区分方向，只记录一个模糊的 schema 文档

**否决理由**：

- 这会把 backend 内部视角错误地暴露给消费者，导致生成出的 client 与实际 wire contract 不一致。
- 不区分方向在 transform/default 场景下会直接生成错误文档。

### 决策 6：OpenAPI 作为 secondary emitter，v1 先聚焦最小稳定子集

**选择**：同一份 bundle 额外生成 `openapi.json` 与 `openapi.yml`。v1 只覆盖最小稳定范围：

- 五类 contract schema source：`body/query/params/headers/response`
- 单个成功响应分支
- 默认 JSON 内容类型
- 从 contract 推导的 method/path 与 schema 文档

更丰富的状态码、summary、tags、多响应分支与安全声明留待后续 change。

**原因**：

- 用户已明确需要一个 monorepo 外可消费的载体，OpenAPI 是最合适的生态输出之一。
- 先收窄到最小稳定子集，可以更快验证生成基础设施，而不把变更扩大为完整 API 设计系统。

**备选方案**：

- 本次不输出 OpenAPI，只输出 Raven bundle
- 一次性引入完整 OpenAPI 元数据模型

**否决理由**：

- 不输出 OpenAPI 无法满足 monorepo 外接口文档与通用工具链消费场景。
- 一次性做完整 OpenAPI 模型会把范围迅速拉大，并要求 contract 新增大量非核心元数据。

## Risks / Trade-offs

- **[Risk] Standard JSON Schema 在不同 schema vendor 的支持度不一致。**  
  **Mitigation**：v1 明确只保证 combined schema 场景可生成 artifact；遇到不支持的 schema 时 build 直接失败并给出可定位错误，而不是静默降级。

- **[Risk] canonical bundle 与 OpenAPI 双产物会增加生成链路复杂度。**  
  **Mitigation**：采用单一 extractor + 多 emitter 结构，让 schema lowering 与 contract indexing 只做一次。

- **[Risk] contract package 作为独立边界后，开发流程需要 watch/build 才能让 frontend 获得最新 artifact。**  
  **Mitigation**：CLI 规范中补充 watch 模式与清晰输出；建议 monorepo task graph 将 contract build/watch 作为 frontend dev 的上游任务。

- **[Risk] 现有“frontend 直接导入 raw contract”推荐路径会与新分发路径并存一段时间，增加心智负担。**  
  **Mitigation**：在文档中明确 raw contract 是 backend authoring truth，distributable artifact 是跨项目消费 truth，并将 artifact 路径设为推荐做法。

- **[Risk] build-contract 若支持过度灵活的 contract 写法，会显著增加 AST 与类型分析复杂度。**  
  **Mitigation**：v1 限制 contract authoring shape，要求顶层可静态识别的 `defineContract(...)` 导出，并对无法分析的模式报错。

## Migration Plan

1. 为 CLI 定义 `raven build-contract` 命令与 package-local 配置发现规则。
2. 在 core/validator 侧补充 contract generation 所需的 serializable schema 要求与类型边界。
3. 实现 standalone generator：静态提取 raw contract，生成 `raven-contract.json` 与 OpenAPI 产物。
4. 为 monorepo 场景补充一个独立 contract package 的推荐结构与最小示例。
5. 更新文档，把“跨项目消费 contract”的推荐路径切换到 artifact/OpenAPI，而非 direct import backend raw contract。

回滚策略：

- 若生成链路不可用，可回退 CLI 命令、bundle/OpenAPI emitter 与相关文档/spec 变更；
- backend runtime contract 与 `withSchema` 行为保持不变，因此回滚不会破坏现有 HTTP 运行时能力。

## Open Questions

- 当前无阻塞性开放问题。未来是否在同一套 bundle 之上继续提供 `generate-client` 命令，将作为后续 change 单独设计，而不阻塞本次 contract artifact 基础设施落地。
