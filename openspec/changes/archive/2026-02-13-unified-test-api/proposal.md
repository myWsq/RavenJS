## Why

当前项目同时使用 Bun 和 Vitest (Node.js) 进行测试，但两者的测试 API（如 `describe`, `it`, `expect`）在导入方式和全局变量支持上存在差异。
构建一个统一的内部测试子项目可以消除这些差异，使得测试代码能够在不同运行时下无缝切换，提高开发效率并降低维护成本。

## What Changes

- 在 `packages/testing` 下创建一个新的子项目。
- 提供统一的测试 API 导出，包括 `describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`。
- 实现运行时自动检测：在 Bun 环境下使用 `bun:test`，在 Node.js/Vitest 环境下使用 `vitest`。
- 支持 TypeScript 类型定义，确保在两种环境下都有良好的 IDE 支持。

## Capabilities

### New Capabilities

- `unified-test-interface`: 提供兼容 Vitest 和 Bun 的统一测试接口。

### Modified Capabilities

- 无

## Impact

- 新增 `packages/testing` 目录。
- 根目录 `package.json` 的 `workspaces` 已包含 `packages/*`，无需修改。
- 之后可以逐步将 `packages/core` 等包的测试代码迁移到此统一接口。
