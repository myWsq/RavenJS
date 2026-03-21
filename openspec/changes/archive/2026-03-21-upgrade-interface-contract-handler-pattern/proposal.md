## Why

当前 RavenJS 官方 pattern 仍把 `Interface Unit` 默认组织成单个 `*.interface.ts` 文件，把 `method`、`path`、request/response schema 与 `handler` 混在同一处。这会让 transport contract 与服务端编排边界不清，也让 frontend 难以直接安全复用 contract value，最终退化成重复维护 `path` / `method` 字面量或只做 type-only import。

RavenJS core 现在已经具备基于 Standard Schema 的请求/响应输入输出推导能力，足以支撑“contract 与 handler 分离”的更稳定默认模式。现在统一升级官方 pattern 与配套 helper，可以让 Agent、backend、frontend 都围绕同一个 contract value 协作，并把 `app.ts` 保持为唯一 composition root。

## What Changes

- 新增 `defineContract`，用于声明 `method`、`path`、`schemas` 以及 contract 相关推导类型，且继续基于 Standard Schema 抽象，不绑定特定 schema 库。
- 新增 `registerContractRoute(app, contract, handler)`，根据 `contract.method` 自动调用 `app.get/post/put/delete/patch` 完成路由注册，不引入 plugin 包装。
- 将官方 interface pattern 从单文件 `*.interface.ts` 升级为“每个接口一个目录，固定拆成 `*.contract.ts` 与 `*.handler.ts`”的默认模式，且目录内不使用 `index.ts`。
- 明确 `contract.ts` 是 transport contract 与 route metadata 的唯一来源，`handler.ts` 只负责 `withSchema(contract.schemas, ...)` 与业务编排。
- 明确 frontend 默认直接 import contract value，复用 `method`、`path`、`schemas` 以及请求/响应类型推导；因此 `contract.ts` 及其依赖树必须保持 frontend-safe。
- 统一更新 `packages/core/pattern/*`、`packages/core/README.md`、`packages/core/GUIDE.md` 等文档，替换旧的单文件 interface 示例与口径。
- **BREAKING**：官方 pattern、教学文档与推荐示例不再把单文件 `*.interface.ts` 视为默认组织方式，新的默认写法改为 contract/handler 分离目录模式。

## Capabilities

### New Capabilities

- `interface-contract-pattern`: 定义 RavenJS 官方的 contract-first interface 模式，要求每个接口使用独立目录，拆分 `contract.ts` 与 `handler.ts`，并支持 frontend 直接复用 contract value。

### Modified Capabilities

- `core-framework`: 路由注册规范需要支持 `registerContractRoute(app, contract, handler)` 这一 contract-aware 注册入口，并保持 `app.ts` 作为唯一 composition root。
- `validator`: schema-aware helper 规范需要支持 `defineContract` 及其基于 Standard Schema 的请求/响应推导语义，确保 request 看 schema input、response 看 schema output 的 contract 推导在 `.default()`、`.transform()` 等场景下仍然正确。
- `pattern-directory-structure`: pattern 文档中的 `interface/` 目录约定需要从单文件 `*.interface.ts` 调整为每个接口一个目录且固定分成 `*.contract.ts` / `*.handler.ts`。
- `core-learning-structure`: GUIDE、README 与 pattern 文档的学习路径需要统一指向新的 contract/handler 分离模式，并明确 frontend-safe contract reuse 是推荐做法。

## Impact

- 受影响代码：`packages/core/index.ts`、schema helper 导出、路由注册 helper，以及相关类型工具。
- 受影响文档：`packages/core/pattern/overview.md`、`conventions.md`、`layer-responsibilities.md`、`runtime-assembly.md`，并视需要同步 `packages/core/README.md`、`packages/core/GUIDE.md`、`packages/core/pattern/anti-patterns.md`。
- 受影响规范：新增 `interface-contract-pattern`，并修改 `core-framework`、`validator`、`pattern-directory-structure`、`core-learning-structure`。
- 对现有运行时基础能力的影响以增量 helper 和文档升级为主；对已有项目的主要变化是推荐写法、示例结构与 Agent 生成默认模式发生切换。
