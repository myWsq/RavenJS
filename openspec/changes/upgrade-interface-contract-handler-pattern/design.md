## Context

当前 RavenJS 的官方 pattern 仍把一个 HTTP entrypoint 组织成单个 `*.interface.ts` 文件，在同一文件里同时放 `method`、`path`、request/response schema 和 `handler`。这在早期可以减少文件数，但现在已经有三个明显问题：

1. transport contract 与服务端编排代码耦合，Agent 很难稳定判断“改 path/schema”与“改业务 handler”分别应落在哪一层。
2. frontend 想复用 contract 时，往往只能复制 `path` / `method` 字符串，或退回到 type-only import，无法把一个可执行的 contract value 当成单一真相来源。
3. `packages/core/index.ts` 当前会连带引入 `node:async_hooks` 等服务端运行时模块；如果 `contract.ts` 直接依赖这一整棵入口树，就无法满足 frontend-safe 边界。

另一方面，core 已经有足够的基础能力支撑拆分：

- `withSchema` 已基于 Standard Schema 工作，而不是绑定 Zod。
- handler 侧的语义已经清晰：request 使用 schema output，response handler 返回 schema input。
- response 校验路径已经证明“schema input / output 不对称”在 `.transform()` 等场景下是有效的。

因此，这次设计的核心不是重新发明校验系统，而是在现有 `withSchema` 能力之上补齐 contract abstraction、route registration helper，以及与之匹配的默认目录/文档模式。

## Goals / Non-Goals

**Goals:**

- 为 RavenJS 增加 `defineContract`，把 `method`、`path`、`schemas` 固化为单一 contract value
- 为 RavenJS 增加 `registerContractRoute(app, contract, handler)`，保持 `app.ts` 为唯一 composition root
- 让 contract 类型推导满足 frontend 视角：request 看 schema input，response 看 schema output
- 让 handler 类型推导继续满足 backend 视角：request 看 schema output，response handler 返回 schema input
- 给 `interface/` 提供新的默认目录模式：`<entry>/<entry>.contract.ts` + `<entry>.handler.ts`
- 明确 `contract.ts` 及其依赖树必须 frontend-safe，frontend 默认直接 import contract value
- 统一更新 core pattern / README / GUIDE 的推荐示例，移除旧的单文件 `*.interface.ts` 作为默认方案

**Non-Goals:**

- 不实现 codegen、OpenAPI 生成或任何额外的协议产物
- 不把 route registration 包装进 plugin，也不引入自动扫描注册
- 不保留旧单文件 `*.interface.ts` 作为官方推荐双轨方案
- 不改变 `withSchema` 的基本调用方式
- 不在本次变更中实现 `requestContract`

## Decisions

### 决策 1：把 contract helper 放进独立的 frontend-safe 模块，再从 root index 二次导出

**选择**：新增一个只依赖 Standard Schema 类型的 contract helper 模块，承载 `defineContract`、contract 类型以及必要的 `InferContract*` 工具。`packages/core/index.ts` 继续二次导出这些 API，保持公共导出地图完整；但 pattern 文档会明确要求 `contract.ts` 自身依赖 frontend-safe contract helper 入口，而不是依赖会连带加载运行时模块的整棵 server 入口。

**原因**：

- `packages/core/index.ts` 当前会通过 state/runtime 模块触达 `node:async_hooks`，不能把“依赖 root index 的 tree-shaking”当成 frontend-safe 边界保证。
- `defineContract` 本身只需要 `StandardSchemaV1` 及其输入/输出类型工具，不需要 Raven runtime、state、hook 或 `Response` 处理。
- 保留 root index 二次导出可以让公开 API 清单完整，也满足用户对 `packages/core/index.ts` 的更新要求。

**备选方案**：

- 只在 `packages/core/index.ts` 导出 `defineContract`，依赖 bundler tree-shaking 保证前端安全
- 把 `defineContract` 和 `registerContractRoute` 都塞进现有 `schema/with-schema.ts`

**否决理由**：

- 依赖 tree-shaking 不能作为规范级“frontend-safe”保证
- 把纯 contract helper 和服务端 route helper 混在同一个模块里，会重新引入依赖边界污染

### 决策 2：`defineContract` 复用 `withSchema` 的 schema 形状，但提供面向 contract 的输入/输出推导

**选择**：`defineContract` 接收 `{ method, path, schemas }`，其中 `schemas` 继续使用 `body/query/params/headers/response` 这组键，直接兼容 `withSchema(contract.schemas, ...)`。同时只补充最小一组 contract 推导工具：

- `InferContractBodyInput<T>`
- `InferContractQueryInput<T>`
- `InferContractParamsInput<T>`
- `InferContractHeadersInput<T>`
- `InferContractResponseOutput<T>`

这些工具全部基于 Standard Schema 的 `InferInput` / `InferOutput` 构建：

- request 侧一律看 schema input
- response 侧一律看 schema output

**原因**：

- 复用同一份 `schemas` 结构可以避免 contract 与 handler 再维护两套 shape
- request / response 在 contract 侧与 handler 侧本来就处于不同阶段，类型方向必须显式区分
- `.default()` / `.transform()` 场景需要依赖 Standard Schema 的 input/output 二元类型；直接读 `InferInput` / `InferOutput` 才能正确表达“前端传入值”和“最终响应值”分别是什么

**备选方案**：

- 让 contract 也沿用 `withSchema` 的方向：request 看 output，response 看 input
- 为每个 schema source 再额外引入大量泛型参数，让调用方显式标注

**否决理由**：

- contract 表达的是 transport contract 给调用方的输入/输出，不是 handler 内部拿到的已校验值
- 显式传很多泛型会让 API 变得脆弱，违背“让 schema 实例自己承载类型信息”的目标

### 决策 3：`registerContractRoute` 只是显式的 method dispatcher，不引入隐藏装配层

**选择**：新增 `registerContractRoute(app, contract, handler)`，内部只做一件事：根据 `contract.method` 调用 `app.get/post/put/delete/patch` 并使用 `contract.path` 注册对应 route。helper 不扫描目录、不自动装配、不引入 plugin，也不改变 `app.ts` 作为唯一 composition root 的规则。

推荐调用形态保持为：

```ts
registerContractRoute(app, CreateOrderContract, CreateOrderHandler);
```

**原因**：

- 用户已经明确拒绝 plugin 化 route registration
- `app.ts` 的可见性是 RavenJS pattern 的重要特征；helper 只应减少样板，不应隐藏路由装配
- 通过 contract 驱动 method/path 注册，可以把“路由元数据唯一来源”固定在 `contract.ts`

**备选方案**：

- 自动扫描 `interface/` 目录并隐式注册
- 为每个接口导出一个 route plugin，然后在 `app.ts` 里注册 plugin

**否决理由**：

- 自动扫描与 plugin 封装都会削弱 composition root 的显式性
- 这类方案会把简单的 metadata reuse 扩大成运行时发现机制，不符合本次目标

### 决策 4：官方 pattern 全面切换到“每个接口一个目录，contract 与 handler 分离”

**选择**：`interface/` 目录的默认结构统一改成：

```text
interface/
  create-order/
    create-order.contract.ts
    create-order.handler.ts
```

并明确：

- 不使用 `index.ts`
- `contract.ts` 是 `method` / `path` / `schemas` / contract type inference 的唯一来源
- `handler.ts` 只导出 `XxxHandler`
- `handler.ts` 通过 `withSchema(Contract.schemas, ...)` 绑定 schema-aware handler
- `app.ts` 通过 `registerContractRoute` 注册路由

**原因**：

- 目录边界比单文件对象字面量更稳定，Agent 更容易定位“改 contract”还是“改 handler”
- `contract.ts` 可以天然成为 frontend 共享值
- “不使用 `index.ts`”可以避免重新引入隐式聚合和路径不透明

**备选方案**：

- 保留 `*.interface.ts` 为默认，再额外介绍 contract/handler split 作为可选高级模式
- 使用 `interface/<entry>/index.ts` 聚合 contract 与 handler

**否决理由**：

- 双默认方案会继续让 Agent 在生成代码时摇摆，无法形成稳定模式
- `index.ts` 会让“contract 才是唯一 metadata source”变得不够直接

### 决策 5：文档同时解释 contract 视角与 handler 视角的类型方向

**选择**：在 pattern 文档、README、GUIDE 中显式区分两套语义：

- contract / frontend 视角
  - request → schema input
  - response → schema output
- handler / backend 视角
  - `ctx.body/query/params/headers` → schema output
  - handler 返回值（声明了 `response` 时）→ response schema input

同时把 frontend 示例统一改成“直接 import contract value”，而不是只导入 type。

**原因**：

- 这组不对称是这次设计里最容易被误解的部分
- 如果不在文档里说清楚，开发者会误以为 contract helper 与 withSchema 的方向应该完全一致，进而在 `.transform()` / `.default()` 场景下得到错误类型

**备选方案**：

- 文档里只给代码例子，不显式解释输入输出方向

**否决理由**：

- 仅靠例子难以让 Agent 稳定归纳出规则，尤其在 response schema transform 场景下

## Risks / Trade-offs

- **[Risk] 新增 frontend-safe contract 入口后，导入路径会比“全都从 `@raven.js/core` 根入口拿”稍复杂。**  
  **Mitigation**：在 README / GUIDE / pattern 文档里明确“contract.ts 用 frontend-safe contract helper 入口；`registerContractRoute` 与 `withSchema` 继续从 server 入口使用”，并把 root index 作为 discoverability export，而不是 contract 模块的默认依赖入口。

- **[Risk] request/response 在 contract 与 handler 两侧的类型方向不一致，容易造成心智混乱。**  
  **Mitigation**：在 validator spec、pattern 文档和示例中统一给出对照说明，并补测试覆盖 `.default()`、`.transform()`、response output serialization 等关键场景。

- **[Risk] 文档切换为新默认模式后，仓库里残留旧的 `*.interface.ts` 示例会削弱规范力度。**  
  **Mitigation**：实现阶段对 `packages/core/pattern/*`、README、GUIDE 和相关说明做全文检索，确保官方推荐口径只剩 contract/handler split。

- **[Risk] `registerContractRoute` 只支持五种 HTTP 方法，未来若要扩展自定义 method 需要调整 helper。**  
  **Mitigation**：本次先严格对齐 Raven 现有公开方法 `get/post/put/delete/patch`；若未来 core 增加新 method，再单独扩展 contract method union 与 helper dispatch。

## Migration Plan

1. 新增 frontend-safe contract helper 模块，定义 `defineContract`、contract 类型与最小 infer 工具，并从 `packages/core/index.ts` 补充公开导出。
2. 新增 `registerContractRoute` 服务端 helper，并为 method dispatch 与 contract-handler 类型兼容关系补测试。
3. 更新 validator / core-framework / pattern 相关 spec delta，使 contract abstraction、route registration 与目录规范都有明确 requirement。
4. 更新 `packages/core/pattern/*`、`packages/core/README.md`、`packages/core/GUIDE.md`，把所有官方示例切换到 contract/handler split 模式。
5. 通过全文搜索确认官方文档中不再把单文件 `*.interface.ts` 作为默认推荐结构。

本次变更主要是 helper + 文档 + spec 升级，不涉及线上部署步骤；若需要回滚，可直接回退 contract helper、route helper 与文档/spec 变更，不影响既有 `withSchema` 路由能力。

## Open Questions

- 暂无阻塞性开放问题。导入入口、helper 命名和 route registration 形态均已在本设计中定案；后续若要补 `requestContract` 或 codegen，再另起 change。
