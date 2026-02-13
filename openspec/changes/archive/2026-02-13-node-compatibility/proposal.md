## Why

使 Raven 框架能够兼容 Node.js 环境。目前该框架是 Bun 优先的（直接使用了 `Bun.serve`），为了扩大用户群体和部署灵活性，我们需要确保它在 Node.js 下也能正常运行，同时保留在 Bun 下的高性能优势。

## What Changes

- **运行时检测**：增加检测当前执行环境（Bun 或 Node.js）的逻辑。
- **抽象服务层**：将直接调用 `Bun.serve` 的逻辑抽象出来，使其能够根据环境选择 `Bun.serve` 或 Node.js 的 HTTP 实现（如使用 `node:http` 或兼容 Fetch API 的服务器，如 `undici` 或 `@whatwg-node/server`）。
- **类型定义调整**：调整 `server` 属性的类型定义，使其不再强依赖于 `Bun.serve` 的返回类型。
- **CI/CD 更新**：在测试工作流中增加 Node.js 环境下的自动化测试。

## Capabilities

### New Capabilities
- `runtime-abstraction`: 提供一个统一的接口来处理不同运行时（Bun, Node.js）之间的差异，如启动服务器、停止服务器等。

### Modified Capabilities
- `http-server`: 确保 HTTP 服务器的启动 (`listen`)、停止 (`stop`) 和请求处理行为在 Node.js 下与 Bun 保持一致。

## Impact

- `packages/main/index.ts`: 需要重构 `Raven` 类以移除对 `Bun` 全局对象的直接硬编码依赖。
- `package.json`: 可能需要添加 Node.js 兼容性相关的依赖（如 polyfills 或 node 类型定义）。
- `packages/main/tests/`: 增加在 Node.js 下运行测试的配置。
