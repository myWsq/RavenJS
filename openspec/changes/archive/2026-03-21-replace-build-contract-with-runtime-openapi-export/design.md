## Context

当前 RavenJS 已经把 route 装配集中在显式的 composition root：开发者通过 `registerContractRoute(app, contract, handler)` 把 contract 驱动的 route 注册到 app。与此同时，`build-contract` 额外引入了一条独立的离线构建链路：扫描源码、提取 contract、materialize schema、写出 bundle 与 OpenAPI 文件。两条链路各自维护“哪些 contract 存在”的真相源，导致配置、测试、文档和心智模型都变重。

从运行时能力看，Raven 在 route 注册时已经掌握 method/path/handler；而 contract-first 模式下，`registerContractRoute(...)` 又天然拿到了完整的 contract value。对于“当前 app 实际暴露了哪些 API”这个问题，运行时装配层比离线扫描更直接，也更符合 Raven 一贯强调的显式组合根模式。

这次变更因此不是“再加一个 OpenAPI 输出口”，而是把 OpenAPI 能力从独立 build pipeline 收编为 app 自身的运行时能力，同时移除之前围绕 contract artifact build 建起来的 CLI / 文档 / 测试结构。

## Goals / Non-Goals

**Goals:**

- 让 `Raven` 实例可以通过 `app.exportOpenAPI(...)` 直接暴露当前 app 的 OpenAPI JSON 文档。
- 让 `registerContractRoute(...)` 在注册 route 时同步记录 contract 元数据，并对冲突 route 做显式失败。
- 保持普通请求/响应校验继续基于现有 Standard Schema 运行时语义。
- 仅在 OpenAPI 导出阶段检查 contract schema 是否满足 Standard JSON Schema；不满足时跳过对应 operation 并发出 warning。
- 移除 `raven build-contract`、contract artifact bundle、独立 contract package 工作流，以及相关文档叙述。
- 尽量复用已有 OpenAPI emitter 逻辑，避免重新发明参数与 requestBody/response 映射规则。

**Non-Goals:**

- 不在本次变更中生成 YAML、SDK、client code 或额外的 distributable artifact 文件。
- 不让普通 `app.get/post/...` 自动出现在 OpenAPI 中；v1 只覆盖通过 `registerContractRoute(...)` 注册的 contract route。
- 不要求所有 schema 都立即支持 Standard JSON Schema；不可导出的 route 允许被跳过。
- 不在本次变更中引入 OpenAPI 的完整元数据模型（例如 tags、security、summary、多响应分支）。
- 不保留 `build-contract` 作为并行推荐路径。

## Decisions

### 决策 1：移除 standalone build pipeline，改为 app 级 runtime OpenAPI exporter

**选择**：废弃 `raven build-contract` 与 contract artifact build pipeline，把 OpenAPI 导出能力直接放进 `Raven` 实例，由 `app.exportOpenAPI(options?)` 暴露 JSON 文档端点。

`exportOpenAPI(...)` 的语义是“为这个 app 开启 OpenAPI 导出”，而不是“立即执行一次离线构建”。文档内容的真相源改为“当前 app 实际注册的 contract routes”。

**原因**：

- contract route 的显式装配入口已经存在于 `registerContractRoute(...)`，没必要再维护一条独立的源码发现链路来回答“当前 app 有哪些 contract”。
- runtime exporter 更符合 Raven 的组合根风格：route、plugin、hook、OpenAPI 暴露都属于 app 级装配问题。
- 删除 build pipeline 后，CLI、测试 fixture、package-local 配置与 contract artifact bundle 都可以同步收缩。

**备选方案**：

- 保留 `build-contract`，额外再增加 `app.exportOpenAPI()`。
- 保留 standalone build，但让 `app.exportOpenAPI()` 只读取已生成的产物文件。

**否决理由**：

- 双轨方案会让“哪份 OpenAPI 才是真相源”重新变得模糊。
- 运行时再回读离线产物，会把 app 装配与文件产物耦合起来，失去 runtime exporter 的直接性。

### 决策 2：在 app 内维护 route manifest，其中 contract metadata 是 route record 的一部分

**选择**：在 `Raven` 内部新增 app 级 route manifest。每条 route record 至少保存：

- `method`
- `path`
- `normalizedPath`
- `handler`
- `contract?`

普通 `app.get/post/...` 只写入普通 route record；`registerContractRoute(...)` 在注册时额外把 `contract` 写入该 record。OpenAPI exporter 只读取带 `contract` 的 route record。

**原因**：

- 仅靠 `RadixRouter` 不能枚举所有 route，也无法保留 contract metadata。
- 把 contract 绑定在 route record 上，比单独维护另一份“contract 列表”更不容易漂移。
- 这样可以顺手把 duplicate route 检测做在统一入口，而不是让 router 的 `Map.set(...)` 静默覆盖已有 handler。

**备选方案**：

- 在 `registerContractRoute(...)` 外部维护一份独立 `WeakMap<app, contracts[]>` registry。
- 继续只把数据放在 `RadixRouter` 中，需要 OpenAPI 时再递归遍历路由树。

**否决理由**：

- 独立 registry 容易和真实 route table 脱节，也不便为普通 route 做冲突保护。
- 递归遍历 router 树会让路径重建、重复检测与 metadata 附着都变得更绕。

### 决策 3：duplicate route 以 `method + path shape` 为冲突键，并在注册时立即失败

**选择**：route 冲突检测采用规范化的 `method + path shape` 作为唯一键。路径规范化时：

- 字面量 segment 保持原样
- 任意 `:paramName` 统一规范成相同占位符
- `*` 保持 wildcard 语义

因此 `/orders/:id` 与 `/orders/:orderId` 在同一 method 下视为同一路径并构成冲突。

**原因**：

- 现有 radix router 对 param child 本来就只保留一个分支，param 名字不同但 shape 相同的路由本质上无法安全共存。
- 提前失败比 silent overwrite 更符合显式装配原则，也更利于排查问题。
- `exportOpenAPI()` 自身注册的 endpoint 也可以复用同一套冲突检测。

**备选方案**：

- 仅在 `registerContractRoute(...)` 做冲突检测，普通 `app.get/post/...` 保持静默覆盖。
- 只按原始 path 字符串冲突，不做 path shape 规范化。

**否决理由**：

- 只覆盖 contract route 会让普通 route 和导出 endpoint 仍然保留 silent overwrite 风险。
- 只按原始字符串比较会漏掉 param 名字不同但路由树 shape 相同的真实冲突。

### 决策 4：`exportOpenAPI(...)` 作为声明式配置 API，文档按 dirty-cache 方式生成

**选择**：`app.exportOpenAPI(options?)` 只负责声明 exporter 配置与注册导出端点；OpenAPI 文档本身采用 app 级缓存，并在 route manifest 变化时标记为 dirty。请求导出端点时，如果缓存是 dirty，则重新根据当前 contract routes 构建文档。

默认配置：

- `path = "/openapi.json"`
- `info.title = "Raven API"`
- `info.version = "1.0.0"`

允许用户通过 options 覆盖 path 与 info。

**原因**：

- 这和 Raven 现有的 `register()` / `ready()` 两阶段模型一致；插件在 `ready()` 期间新增 route 时，导出文档仍能反映最终结果。
- dirty-cache 既能避免每次请求都重新 materialize schema，也能兼容 `app.use(...)` 这类在 `ready()` 之后追加 route 的场景。
- 默认 path 与 info 让最小使用成本足够低，自定义项则覆盖真实项目需要。

**备选方案**：

- `exportOpenAPI()` 调用时立即构建一次静态文档。
- `ready()` 完成时固定生成一次，之后不再更新。

**否决理由**：

- 立即构建拿不到后续 plugin / `onLoaded` 才注册的 route。
- 只在 `ready()` 生成一次会让 `app.use(...)` 之后的 route 与文档失去同步。

### 决策 5：OpenAPI exporter 复用现有最小 emitter 语义，但不再依赖源码级 exportName

**选择**：runtime exporter 复用当前 build-contract 中已经验证过的最小 OpenAPI 语义：

- `body/query/params/headers/response`
- 默认 `200 application/json` 成功响应
- `:id` -> `{id}` 路径参数转换

但 runtime exporter 不再尝试读取源码级 `exportName` 或 `sourcePath`，因此 v1 不把这些字段作为文档必须项。

**原因**：

- 现有 emitter 已经覆盖当前项目需要的最小稳定子集，迁移成本最低。
- runtime registry 拿不到源码导出名，继续依赖 `exportName` 会把设计重新拖回 AST / module scan。
- OpenAPI 的核心可用性主要来自 `paths`、`parameters`、`requestBody`、`responses` 与 `components.schemas`，不是 `exportName`。

**备选方案**：

- 在 runtime exporter 中尝试推导或强制要求 `operationId`。
- 重新定义一套与 build-contract 完全不同的 OpenAPI 映射。

**否决理由**：

- 推导 `operationId` 会引入额外命名规则争议，但对当前目标没有决定性价值。
- 重写 emitter 会放大范围，而不是复用现有稳定逻辑。

### 决策 6：schema 不满足 Standard JSON Schema 时，跳过整个 operation 并发出 warning

**选择**：OpenAPI exporter 在构建某个 contract operation 时，逐项 materialize `body/query/params/headers/response` 为 `openapi-3.0` target。只要该 contract 的任一相关 schema 不满足 Standard JSON Schema，或 materialization 失败，就跳过整个 operation，并通过 warning 报出 method/path 与失败原因。

warning 不影响：

- route 的正常请求处理
- `ready()` 成功完成
- 其他可导出 contract 的 OpenAPI 暴露

**原因**：

- 用户已经明确不希望因为 OpenAPI 导出而收紧普通运行时校验能力。
- 跳过整个 operation 比输出半残的参数或 response 文档更诚实，避免消费者拿到错误接口定义。
- warning 让团队仍然能发现“哪些 route 尚未具备可导出 schema”。

**备选方案**：

- 发现任一不可导出 schema 就让 `ready()` 失败。
- 只删除出错的 schema 段落，保留剩余部分继续生成该 operation。

**否决理由**：

- 直接让 `ready()` 失败会把文档能力升级成请求处理的硬依赖，与用户目标相反。
- 半残 operation 会制造更隐蔽的错误文档。

## Risks / Trade-offs

- **[Risk] runtime exporter 只能覆盖当前 app 实际注册的 contract route，而不是源码里所有 contract。**  
  **Mitigation**：在文档中明确这是 app-level truth；如果某个 contract 未接入当前 app，就不会出现在该 app 的 OpenAPI 中。

- **[Risk] warning + skip 语义可能让部分 route 长期缺失在 OpenAPI 中。**  
  **Mitigation**：warning 需要包含 method/path 与错误原因，并在测试中覆盖“不可导出 route 被跳过”的显式行为。

- **[Risk] duplicate detection 会暴露现有潜伏的路由冲突。**  
  **Mitigation**：错误信息应包含 method、原始 path、规范化 path 和已存在注册来源，帮助快速修复。

- **[Risk] 移除 build-contract 会删掉当前 CLI / fixture / 文档的一大块内容，回归范围较大。**  
  **Mitigation**：按“core runtime -> tests -> docs -> cli cleanup”的顺序迁移，并保留 emitter 相关测试思路，改写为 runtime exporter 场景。

## Migration Plan

1. 在 core 中引入 app 级 route manifest、contract metadata 附着与 duplicate detection。
2. 把 OpenAPI emitter 从 CLI build pipeline 抽到 core runtime exporter，并实现 `app.exportOpenAPI(...)`。
3. 为 runtime exporter 增加单元测试 / 集成测试，覆盖默认路径、自定义路径、冲突检测、warning + skip 行为。
4. 删除 `build-contract` CLI 命令、快照子命令、相关 fixture 与测试。
5. 更新 README / GUIDE / pattern 文档，把 OpenAPI 暴露推荐路径统一切到 `app.exportOpenAPI(...)`。

回滚策略：

- 本次变更不涉及持久化数据迁移；如需回滚，可整体恢复 `build-contract` CLI 与原有文档，并移除 `exportOpenAPI(...)` 相关实现。
- 因为普通 route handler 与 Standard Schema 运行时校验语义保持不变，回滚不会影响既有请求处理逻辑。

## Open Questions

- 当前无阻塞性开放问题。后续若需要 YAML 导出、严格模式（不可导出 schema 直接失败）或 richer OpenAPI metadata，将作为后续 change 单独设计。
