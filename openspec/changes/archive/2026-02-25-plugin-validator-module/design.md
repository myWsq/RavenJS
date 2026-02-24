## Context

当前项目需要实现一个 `plugin-validator` 模块，用于对 HTTP 请求的参数（body、query、params、headers）进行校验。项目使用 Bun + TypeScript，已有一个 `standard-schema.ts` 定义了 Standard Schema 接口。

现有模块结构：
- `modules/core/` - 核心框架，包含 Router、Context、State 等
- `modules/jtd-validator/` - 基于 JTD 的校验器

## Goals / Non-Goals

**Goals:**
- 实现 `withSchema` 高阶函数，支持基于 Standard Schema 的参数校验
- 支持 `body`、`query`、`params`、`headers` 四个位置的校验
- 校验失败时返回 400 状态码和详细错误信息
- 校验成功时将解析后的参数通过 Context 传递给 handler
- 无需直接依赖具体 schema 库，实现黑盒校验

**Non-Goals:**
- 不实现具体的 schema DSL（由其他模块如 jtd-validator 提供）
- 不处理路由匹配逻辑（由 core 模块处理）
- 不提供默认的错误响应格式定制（可后续扩展）

## Decisions

1. **使用 Standard Schema 作为校验接口**
   - 原因：Standard Schema 是通用的 schema 接口，可以适配多种校验库
   - 优点：解耦校验逻辑和具体实现，支持黑盒校验

2. **Context 类型设计**
   - 原因：需要将校验后的参数传递给 handler
   - 设计：创建 `Context<B, Q, P, H>` 泛型接口，包含 `body`、`query`、`params`、`headers` 属性

3. **校验失败响应**
   - 原因：保持简单明确的错误处理
   - 设计：返回 400 状态码，JSON 格式的错误信息，包含 issues 数组

4. **模块目录结构**
   - 位置：`modules/plugin-validator/`
   - 遵循现有模块的单文件组织方式

## Risks / Trade-offs

- **Risk**: 需要确保 Standard Schema 的 validate 函数是异步的
  - **Mitigation**: 在实现中处理同步和异步两种情况

- **Risk**: handler 的返回类型需要与 core 模块兼容
  - **Mitigation**: 使用 `Response | Promise<Response>` 作为返回类型，与 core 模块一致
