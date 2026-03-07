## Context

当前请求校验链路被拆成两层：

- `@raven.js/core` 负责路由匹配、构造 `RavenContext`、写入 `BodyState` / `QueryState` / `ParamsState` / `HeadersState`
- `@raven.js/schema-validator` 负责读取这些 State、执行 Standard Schema 校验、组装 typed context、抛出 `ValidationError`

这意味着校验能力虽然逻辑上附着在 core 的请求生命周期上，但在代码组织、模块安装、CLI registry、README 与测试结构上却被视为一个独立模块。当前仓库里大量文档、CLI E2E 和模块清单都要额外处理 `schema-validator`，而 core 本身仍不知道 schema-aware handler 的存在。

这次变更明确不考虑兼容性，因此可以直接调整边界：校验是 core 的原生能力，不再通过外部模块包装接入。

## Goals / Non-Goals

**Goals:**

- 将 Standard Schema 校验能力、错误类型和类型工具统一收敛到 `@raven.js/core`
- 让 core 在请求生命周期内原生识别 schema-aware handler，而不是依赖外部 wrapper 间接执行
- 保持对具体校验库的无绑定，只依赖 Standard Schema 协议
- 删除独立 `schema-validator` 模块，简化模块分发、CLI registry、README 和测试面
- 让校验后的值可以直接进入 core State 流程，供 hooks 和 handler 共享

**Non-Goals:**

- 不保留 `@raven.js/schema-validator` 的兼容导出、别名包或迁移适配层
- 不引入响应 schema 校验、OpenAPI 生成或自动 400 响应格式化
- 不改变 `onError` 作为统一错误出口的设计

## Decisions

### Decision 1: 校验相关类型与工具整体迁入 core

将以下内容迁入 `modules/core`，作为 core 的正式导出：

- `StandardSchemaV1`
- `Schemas` / `Context` 等 schema-aware handler 类型
- `ValidationError`
- `isValidationError`
- `SchemaClass`
- `withSchema`

`SchemaClass` 仍保持“仅用于类型推断、不执行运行时校验”的语义；`ValidationError` 仍按 body/query/params/headers 维度暴露 issues。

选择这一方案是为了让“请求数据进入系统后的解析、校验、错误抛出、状态写入”全部由同一个模块负责，避免 core 与 validator 双边维护同一套概念。

备选方案：仅把源码复制到 core，但继续保留独立模块作为 re-export 外壳。  
放弃原因：这仍然保留双入口、双文档、双测试和 CLI 模块分发复杂度，与本次“直接内置”的目标冲突。

### Decision 2: `withSchema` 改为生成由 core 识别的 schema-aware handler 描述

保留 `withSchema(schemas, handler)` 这一开发体验，但其返回值不再只是一个自执行 wrapper，而是一个由 core 路由层识别的 schema-aware handler 描述对象。路由注册时会把以下信息归一化进 `RouteData`：

- 原始业务 handler
- 对应的 body/query/params/headers schemas
- 标记该路由是否需要 schema 校验

这样做有两个直接收益：

- 类型推断体验保留，业务代码仍可写成 `(ctx) => Response`
- 校验不再藏在 handler 闭包里，而是进入 core 的请求分发主链路

备选方案：改成 `app.post(path, { schema, handler })` 一类全新注册 API。  
放弃原因：虽然更“纯”，但会让这次变更同时承担新的路由声明风格迁移，扩大重构范围。

### Decision 3: 校验发生在 `processStates` 阶段，并将校验后的输出写回内建 State

请求处理顺序调整为：

`onRequest -> route match -> Context 构建 -> processStates(解析原始数据 + 执行 schema 校验 + 写入校验后状态) -> beforeHandle -> schema handler / standard handler -> beforeResponse`

对于声明了 schema 的路由：

- Core 先解析原始 body/query/params/headers
- 若存在对应 schema，则调用 `schema["~standard"].validate(...)`
- 校验成功后，把 schema 输出值写入对应 State
- 校验失败后，立即抛出 `ValidationError`

对于未声明 schema 的路由：

- 保持现有行为，只写入原始解析结果

选择在 `processStates` 阶段完成校验，而不是等到 handler 即将执行时再做，有两个原因：

1. 这样 `beforeHandle` 钩子读取到的是和业务 handler 一致的数据视图
2. 解析、规范化、状态写入都落在 core 生命周期的同一位置，模型更清晰

这是一个明确的 breaking change：声明了 schema 的路由中，`BodyState` / `QueryState` / `ParamsState` / `HeadersState` 读取到的是校验后的输出值，而不是原始输入值。若需要原始请求，仍可通过 `RavenContext.getOrFailed().request` 自行读取。

备选方案：沿用旧行为，在 handler 调用前单独校验，并让 State 继续保存原始值。  
放弃原因：这会让 beforeHandle 与 handler 看到不同的数据语义，也会保留“校验属于 wrapper 而非 core 生命周期”的旧问题。

### Decision 4: ValidationError 继续走统一错误通道，不由 core 自动生成 400 响应

校验失败仍然通过抛出 `ValidationError` 进入现有 `onError` 链路。Core 默认不为校验错误生成特定响应体，只负责把异常纳入统一错误处理机制。

这样做可以保持错误处理策略的一致性：

- 有统一错误响应格式需求的项目，继续在 `app.onError()` 中处理
- 未显式处理时，仍走 core 默认错误响应行为

备选方案：校验失败直接由 core 返回固定的 400 JSON。  
放弃原因：这会把响应格式策略硬编码进框架核心，破坏现有 `onError` 的职责边界。

### Decision 5: 独立 `schema-validator` 模块在同一变更中完全移除

该变更会同时删除：

- `modules/schema-validator/`
- README 中的独立模块条目
- CLI registry 中对应模块
- 依赖 `raven add schema-validator` 的 E2E 与模块安装断言

相关单元测试会并入 core 测试域，文档示例统一改为从 `@raven.js/core` 导入校验 API。

备选方案：先迁入 core，再把 `schema-validator` 保留为 deprecated 模块。  
放弃原因：用户已明确不需要兼容层；保留旧模块只会延长双栈状态。

## Risks / Trade-offs

- [Risk] `beforeHandle` 读取到的数据从“原始值”变成“schema 输出值” → Mitigation: 在 spec 和 README 中将其标记为 breaking change，并强调原始请求仍可通过 `RavenContext.request` 获取
- [Risk] core 对外导出面扩大，增加理解成本 → Mitigation: 将校验实现收敛在独立文件或清晰分区中，README/GUIDE 明确“core 同时承载路由与校验”
- [Risk] 删除独立模块会波及 CLI registry、README、E2E、文档引用，改动面较广 → Mitigation: 任务中把代码、文档、CLI、测试拆分为独立步骤，并在实现阶段一次性清理所有 `schema-validator` 引用
- [Risk] Standard Schema 结果会对 query/body 做转换，可能影响旧代码对原始字符串/对象的预期 → Mitigation: 明确这是非兼容重构，并通过 validator/core 单元测试覆盖“状态中保存的是 schema 输出”这一新语义

## Migration Plan

1. 将 `modules/schema-validator` 的类型定义与实现迁入 `modules/core`
2. 扩展 core 的路由数据结构与分发流程，使 schema-aware handler 在 dispatch 阶段被识别
3. 调整 `processStates`，支持按 route schema 校验并写回校验后的 State
4. 删除 `modules/schema-validator` 及其 registry/README/测试引用
5. 更新示例、GUIDE、README 和 docs 中的导入路径与推荐写法

本次不提供回滚兼容层；若需要回退，只能整体回退该 change。

## Open Questions

无。该变更按“直接内建、直接移除旧模块”的方向推进。
