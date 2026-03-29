## Why

当前 `raven build-contract` 把 contract 分发与 OpenAPI 生成放在一条独立的离线构建链路里，但这条链路需要额外的配置、扫描和产物管理，和 Raven 已有的显式 `registerContractRoute(app, contract, handler)` 组合根模式是割裂的。既然 app 在装配期已经知道自己实际注册了哪些 contract，更直接的做法是让 app 自身拥有导出 OpenAPI 的能力，并把冲突检测与文档暴露一并收拢到运行时装配层。

## What Changes

- **BREAKING** 移除 `raven build-contract` CLI 命令、contract artifact bundle 产物以及与独立 contract package 相关的推荐工作流。
- 新增 app 级 OpenAPI 导出能力，使 `Raven` 可以基于已注册 contract 暴露完整的 OpenAPI 文档端点，并允许配置默认路径或自定义路径。
- 扩展 `registerContractRoute(app, contract, handler)` 的职责：除 method/path 分发外，还负责把 contract 记录到 app 级 registry，并在注册时执行路由冲突检测。
- OpenAPI 导出阶段以已注册 contract 为真相源；对于 schema 不满足 Standard JSON Schema 的 contract，系统 SHALL 跳过对应 operation 的导出，并给出 warning，而不是中断普通请求处理。
- 更新 core README / GUIDE / pattern 文档，移除 `build-contract` 与独立 contract package 的描述，将跨项目接口暴露的推荐路径改为 app 级 OpenAPI 导出。

## Capabilities

### New Capabilities

- `runtime-openapi-export`: 定义 app 级 contract registry、OpenAPI 文档导出端点、导出时 warning 行为与默认/自定义路径配置。

### Modified Capabilities

- `core-framework`: `registerContractRoute` 从纯 method dispatcher 扩展为 contract registry 与冲突检测入口，且 app 在 `ready()` 完成后必须能基于实际注册的 contract 提供 OpenAPI 暴露能力。
- `core-learning-structure`: core README / GUIDE / pattern 文档的学习路径与推荐实践改为 runtime OpenAPI export，移除 `build-contract`、contract package 和 artifact bundle 的相关描述。

## Impact

- 受影响代码：`packages/core/app`、`packages/core/routing`、`packages/core/contract`、`packages/cli`、相关测试与 core 文档。
- 受影响 API：新增 `app.exportOpenAPI(...)`；`registerContractRoute(...)` 增加 registry / 冲突检测语义；移除 `raven build-contract` 及相关隐藏快照子命令。
- 受影响系统：route 装配流程、OpenAPI 暴露方式、跨项目接口消费路径、contract 冲突检测。
- 依赖与兼容性：普通运行时校验继续基于 Standard Schema；OpenAPI 导出仅在导出阶段要求 schema 具备 Standard JSON Schema 能力，不满足时跳过并产生 warning。
