## Why

为了统一测试 API 并确保测试代码在 Bun 和 Node.js 环境下的一致性，需要将 `packages/core` 中的所有测试文件迁移到使用新创建的 `@ravenjs/testing` 包。

## What Changes

- 修改 `packages/core/tests/` 下的所有 `.test.ts` 文件。
- 将从 `vitest` 或 `bun:test` 的导入替换为从 `@ravenjs/testing` 导入。
- 确保所有测试在 Bun 和 Vitest 环境下依然通过。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `unified-test-interface`: 将此能力应用到 `core` 包。

## Impact

- `packages/core` 的测试代码。
- 提高了测试代码的可移植性。
