## Why

Raven 框架目前只有一个空的类定义，无法提供任何 HTTP 服务能力。作为高性能 Bun 网络框架的第一步，我们需要建立基础的 HTTP 服务器能力，这是后续所有功能（生命周期钩子、插件系统、路由、参数解析）的基础。没有这个能力，框架无法启动和响应请求，其他功能也无法验证和构建。

## What Changes

- Raven 类能够启动 Bun HTTP 服务器
- 实现基础的请求处理流程（接收请求 → 处理 → 返回响应）
- 定义核心类型和接口（Request/Response 上下文）
- 为生命周期钩子系统预留接口（暂不实现具体钩子）
- 提供简单的配置选项（端口、主机等）

## Capabilities

### New Capabilities

- `http-server`: 提供基础的 HTTP 服务器能力，包括服务器启动、请求接收、响应返回等核心功能

### Modified Capabilities

<!-- 无 -->

## Impact

- `packages/main/index.ts`: Raven 类将实现服务器启动和请求处理逻辑
- 可能需要新增类型定义文件（如 `types.ts` 或 `context.ts`）来定义请求/响应上下文
- 依赖 Bun 运行时（已通过 `@types/bun` 提供类型支持）
