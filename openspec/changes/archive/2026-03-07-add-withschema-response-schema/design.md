## Context

当前 `withSchema` 只把请求侧的 `body`、`query`、`params`、`headers` schema 挂到 schema-aware handler 描述对象上。请求进入后，core 在 `processStates` 中完成请求数据解析与校验，并把校验后的输出写回内建 State；随后 `Raven.addRoute()` 在注册阶段创建一个包装函数，把这些 State 重新组装为 typed `ctx` 传给业务 handler。

这条链路的结果是：

- 请求输入已经具备“声明 schema -> 自动校验 -> typed ctx”的完整体验
- 响应输出仍然停留在“业务 handler 自己 parse/serialize，再手动 `Response.json(...)`”的模式
- `dispatchRequest()` 与 `beforeResponse` 目前都假定路由 handler 最终返回 `Response`

本次变更需要在不破坏现有 `Response` 返回链路的前提下，为 schema-aware handler 增加一个“返回 DTO -> 校验/转换 -> 自动生成 JSON Response”的可选分支。

## Goals / Non-Goals

**Goals:**

- 为 `withSchema` 增加可选的 `response` schema 声明
- 当声明 `response` schema 时，让业务 handler 的返回类型自动切换为该 schema 的输入类型
- 在 core 内部完成 response schema 校验/转换，并将其统一包装为 `Response.json(...)`
- 保持未声明 `response` schema 的行为与类型签名不变
- 让 `beforeResponse`、`onError` 等既有生命周期继续围绕 `Response` 工作

**Non-Goals:**

- 不改变 `withSchema` 的调用方式，仍然保持 `withSchema(schemas, handler)`
- 不为本次变更引入 OpenAPI 生成、响应状态码推断或多响应分支声明
- 不在声明了 `response` schema 时继续支持从该 handler 直接返回自定义 `Response`
- 不改变请求 schema 校验时机，仍然保持在 `beforeHandle` 之前执行

## Decisions

### Decision 1: `Schemas` 增加 `response`，并通过 `withSchema` 重载切换 handler 返回类型

`Schemas` 将新增可选的 `response` 字段，类型为 Standard Schema。`withSchema` 通过重载或条件类型区分两种模式：

- 无 `response` schema：handler 返回 `Response | Promise<Response>`
- 有 `response` schema：handler 返回 `response` schema 的输入类型或其 Promise

这样可以保持现有调用代码不变，同时让 TypeScript 在声明 response schema 后自动把业务返回值约束为 DTO，而不是 `Response`。

选择重载/条件类型而不是让调用方显式传入更多泛型参数，是为了继续依赖 schema 实例本身完成输入/输出类型推断，避免把原本简单的 `withSchema` 变成需要手工标注六到七个泛型参数的 API。

备选方案：始终让 handler 返回 `Response | DTO` 的联合类型。  
放弃原因：这会让“声明了 response schema”后的约束变弱，既无法确保业务代码真正走 DTO 路径，也会让 route wrapper 的分支处理更模糊。

### Decision 2: 请求 schema 继续在 `processStates` 校验，响应 schema 在 schema-aware route wrapper 中校验

请求校验仍然保留在 `processStates()`，不把 response schema 逻辑塞进该阶段。响应 schema 校验放在 `Raven.addRoute()` 创建的 schema-aware wrapper 中执行：

1. wrapper 从内建 State 组装 typed `ctx`
2. 调用业务 handler，拿到 DTO 输入值
3. 若声明了 `response` schema，则调用 Standard Schema `validate`
4. 使用 schema 输出值构造 `Response.json(...)`
5. 将最终 `Response` 继续交给 `dispatchRequest()` 的既有 `beforeResponse` 链路

这样做的好处是：

- `dispatchRequest()`、`RouteData.handler` 和 `beforeResponse` 仍然只面对 `Response`
- 请求校验与响应校验分别留在最贴近各自职责的位置
- 现有普通 handler 与无 response schema 的 schema-aware handler 不需要改动执行模型

备选方案：把 response schema 校验统一塞进 `dispatchRequest()`。  
放弃原因：这会把“Response 之前可能是 DTO”这种特殊分支扩散到通用分发逻辑，增加核心请求链路复杂度。

### Decision 3: response schema 复用 Standard Schema validate，但 mismatch 不打断主响应链路

response schema 的运行时行为在校验方式上与请求 schema 保持一致：core 调用 `schema["~standard"].validate(...)`，成功时取其输出值；但当 response schema 不匹配时，core 不抛出到统一 `onError`，而是构造带 `responseIssues` 的 `ValidationError` 并触发专门的 response validation hook，然后回退为 `Response.json(handler 原始返回值)`。

为了承载这一能力，`ValidationError` 继续扩展 `responseIssues` 维度，使 response mismatch hook 能拿到与请求校验同构的 issue 结构。这样做的原因是：

- 可以继续复用现有 Standard Schema issue 结构
- `isValidationError()` 不需要新增平行 API
- response mismatch hook、测试和文档都能沿用“统一 issue 模型”的模式
- response 校验从强约束改为防御性观测，避免因为返回 DTO 的格式漂移而把接口主链路直接打挂

对应的 hook 设计保持轻量：默认只用于告警、日志或指标记录，不参与主响应构造。这样可以把 response schema 定位为线上保护网，而不是强制门禁。

备选方案：引入新的 `ResponseValidationError`。  
放弃原因：虽然语义更细，但会额外扩展公开 API、测试矩阵和文档复杂度；对这次以 `withSchema` 增强为主的变更来说偏重。

### Decision 4: `response` schema 路径只负责默认 JSON 响应封装，不扩展 `ResponseInit`

当声明 `response` schema 时，core 固定以 `Response.json(validatedOutput)` 构造最终响应。也就是说，这条路径默认返回 `200 application/json`，不在本次变更中支持额外的 `status`、`headers` 或自定义 `ResponseInit`。

这个约束直接对应用户期望的“handler 返回 DTO，最终由框架包装成 `Response.json(...)`”。如果业务仍然需要完全手动控制 HTTP 响应细节，可以继续不声明 `response` schema，保持返回 `Response` 的老模式。

备选方案：让 handler 返回 `{ body, init }` 一类新结构。  
放弃原因：这会引入另一套返回协议，扩大 API 面，并把本次本来清晰的“DTO 或 Response 二选一”变成第三种模式。

## Risks / Trade-offs

- [Risk] response schema mismatch 不再阻断响应，错误可能被忽略 -> Mitigation: 提供专用 hook，并在文档中明确建议接日志/告警/指标
- [Risk] 为 `ValidationError` 增加 `responseIssues` 仍可能影响调用方对该类型的理解 -> Mitigation: 在 spec、README 与示例中明确 `responseIssues` 主要通过 response validation hook 暴露，而不是默认进入 `onError`
- [Risk] 启用 `response` schema 后默认只能返回 200 JSON 响应，无法直接设置自定义状态码 -> Mitigation: 明确这是本次设计的非目标，需要更高自定义度时继续使用 `Response` 返回模式
- [Risk] `withSchema` 的类型重载变复杂，可能影响导出类型可读性 -> Mitigation: 尽量把复杂条件类型收敛在内部辅助类型中，对外保留 `withSchema(schemas, handler)` 这一入口
- [Risk] response schema 的转换结果可能与 handler 原始 DTO 不同；而 mismatch fallback 会改为返回原始 DTO -> Mitigation: 在 spec 中明确两条路径，并要求 hook 只做观测不改主流程

## Migration Plan

1. 扩展 `withSchema` 相关类型定义，加入 `response` schema 与新的 handler 返回类型分支
2. 在 schema 校验工具中补齐 response 校验辅助逻辑与 `responseIssues`
3. 扩展 core hooks，增加 response schema mismatch 专用 hook
4. 调整 `Raven.addRoute()` 的 schema-aware wrapper，使其在 response schema 模式下优先输出 schema 校验后的 JSON；若 mismatch，则触发 hook 并回退到原始 DTO 的 JSON 响应
5. 更新 validator/core-framework spec、README 与单元测试，覆盖成功路径、mismatch hook 路径与兼容路径
6. 保持普通 handler 和未声明 response schema 的现有行为不变

本次变更不涉及数据迁移。若需要回退，可直接移除 `response` schema 相关类型与 wrapper 分支，恢复现有 `Response`-only 语义。

## Open Questions

无。本次先按“response schema = DTO 输入 + 默认 JSON 响应封装”的单一路径推进。
