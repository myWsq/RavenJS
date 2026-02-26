## Context

Raven 框架目前深度耦合 Bun 的原生 API（主要是 `Bun.serve`）。为了实现 Node.js 兼容性，我们需要解耦服务器启动逻辑。

## Goals / Non-Goals

**Goals:**

- 提供统一的 `app.listen()` 和 `app.stop()` 接口。
- 在 Bun 环境下保持零开销（继续使用 `Bun.serve`）。
- 在 Node.js 环境下支持标准的 Web Request/Response 对象。
- 最小化对核心逻辑的改动。

**Non-Goals:**

- 在 Node.js 下完全达到 Bun 的性能水平。
- 支持非常旧版本的 Node.js（建议 Node.js 18+，因为它原生支持 Fetch API）。

## Decisions

### 1. 运行时抽象接口 (ServerAdapter)

定义一个 `ServerAdapter` 接口，包含 `listen` 和 `stop` 方法。

```typescript
interface ServerAdapter {
  listen(config: ServerConfig, handler: (req: Request) => Promise<Response>): void;
  stop(): void;
}
```

### 2. 自动环境检测

在 `Raven` 类初始化或 `listen` 调用时，通过 `globalThis.Bun` 是否存在来判断当前环境。

### 3. Node.js 实现方案

对于 Node.js，我们将使用一个轻量级的包装器，将 `node:http` 的请求/响应转换为 Web 标准的 `Request`/`Response`。考虑到性能和依赖，我们可以考虑使用现有的成熟库如 `@whatwg-node/server`，或者编写一个简单的内部转换逻辑（利用 Node.js 18+ 的 `Request`/`Response` 构造函数）。

**选择：** 内部简单包装 `node:http`，以保持框架轻量级。

### 4. 类型定义解耦

将 `Raven` 类的 `server` 属性类型从 `ReturnType<typeof Bun.serve>` 改为更通用的类型，或者通过适配器内部持有。

## Risks / Trade-offs

- **[Risk]** 性能差异 → **[Mitigation]** 文档说明 Bun 是推荐运行时，Node.js 仅作为兼容支持。
- **[Risk]** Web Standard API 差异 → **[Mitigation]** 要求 Node.js 版本至少为 18.x，以确保基本的 Fetch API 支持。
