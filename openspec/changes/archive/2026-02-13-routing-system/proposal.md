## Why

Raven 框架目前仅支持单一的默认处理器（defaultHandler），缺乏灵活的路由分发能力。为了支持现代 Web 应用，需要引入一套高性能、支持路径参数、查询参数以及路由组的路由系统。同时，为了保持框架的模块化和封装性，路由系统需要与生命周期钩子深度集成，支持按组进行钩子隔离。

## What Changes

- **路由方法**: 在 `Raven` 类中添加 `get`, `post`, `put`, `delete`, `patch` 等标准 HTTP 方法支持。
- **Radix Tree 路由**: 实现基于 Radix Tree 的高性能路由匹配器，支持静态路径、路径参数（如 `:id`）和通配符。
- **路由组与前缀**: 添加 `group` 方法，支持路由嵌套和前缀累加。
- **Context 增强**: **BREAKING** 更新 `Context` 接口，包含 `params` (路径参数) 和 `query` (查询参数)。
- **生命周期集成**: 调整 `Context` 创建时机，使其在 `onRequest` 钩子执行后、`beforeHandle` 钩子执行前组装。
- **作用域钩子**: 支持在路由组内注册仅对该组有效的生命周期钩子。

## Capabilities

### New Capabilities

- `routing-system`: 核心路由匹配、参数提取、路由组管理以及与生命周期的集成逻辑。

### Modified Capabilities

- `lifecycle-hooks`: 调整钩子执行顺序和 Context 组装逻辑，支持作用域感知的钩子回溯执行。

## Impact

- `packages/main/index.ts`: `Raven` 类将经历重大重构，引入路由树和新的请求处理流。
- `packages/main/index.ts`: `Context` 接口定义将发生变化，影响所有依赖它的处理器。
- 性能：引入 Radix Tree 匹配可能对极端简单场景有微小开销，但对复杂路由应用性能提升显著。
