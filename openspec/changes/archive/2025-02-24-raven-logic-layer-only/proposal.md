# Raven Logic-Layer Refactoring

## Why

Raven 的核心能力（路由、hooks、state、handler 执行）本质上是纯逻辑：给定一个 `Request`，返回一个 `Response`，与网络传输无关。当前将 `listen()`（Bun.serve）与 Raven 类耦合，既限制框架在非 Bun 或非 HTTP 场景下的复用，也模糊了「逻辑层」与「传输层」的边界。将 Raven 重构为纯粹的逻辑层框架，可使其定位更清晰，便于接入任意 Fetch 兼容环境（Bun、Deno、Cloudflare Workers、测试等）。

## What Changes

- **移除** Raven 类中的 `listen()` 和 `stop()` 方法，以及 `Bun.serve` 依赖
- **重命名** `handleRequest` 为更贴近「处理/分发」语义的名称（如 `handle` 或 `dispatch`），突出其为唯一入口
- **保留** Raven 作为 FetchHandler：`(request: Request) => Promise<Response>`，与 Web API 一致
- **可选**：提供独立适配模块（如 `@raven/bun` 或示例脚本），演示如何用 Bun.serve 接入 Raven，但该逻辑不再位于 core
- **BREAKING**：依赖 `app.listen()` 启动服务器的代码需改为自行调用 `Bun.serve({ fetch: app.handle })` 或使用适配示例

## Capabilities

### New Capabilities

无。本次为对现有 core-framework 的重构，不引入新能力。

### Modified Capabilities

- `core-framework`：移除 listen/stop 相关需求；重命名 handleRequest 为 handle；明确 Raven 为逻辑层，不包含 HTTP 服务器启动

## Impact

- `modules/core/index.ts`：删除 `listen()`、`stop()`、`server` 属性及 `Bun.serve` 调用；`handleRequest` 重命名为 `handle`（或选定名称）
- 所有测试：已直接使用 `handleRequest`，仅需改为新方法名
- `openspec/specs/core-framework/spec.md`：更新运行时、服务器相关需求
- 文档与示例：需说明如何将 Raven 接入 Bun.serve 或其他 Fetch 环境
