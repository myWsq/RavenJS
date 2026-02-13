## Why

`packages/testing` 中的 API 桥接使用了顶层 `await import` 和 `any` 类型，导致 IDE 中出现大量类型错误和提示不明确的问题。需要提供更显式的类型定义。

## What Changes

- 在 `packages/testing/index.ts` 中引入显式类型定义。
- 使用 `import type` 从 `bun:test` 和 `vitest` 获取类型，并创建一个联合或兼容类型。
- 修复 `vi` 对象的类型定义。

## Capabilities

### New Capabilities
- `testing-type-safety`: 确保测试 API 的类型安全。

### Modified Capabilities
- 无

## Impact

- 仅影响 `packages/testing` 的类型推导。
