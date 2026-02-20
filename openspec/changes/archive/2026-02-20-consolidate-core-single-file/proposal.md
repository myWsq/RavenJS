## Why

当前 `packages/core` 的代码分散在多个文件中（main.ts + 5 个 utils 文件），增加了代码导航和理解的复杂度。对于 Raven 这样规模的核心库，将所有代码整合到单一文件中可以提高可读性和维护性，同时减少模块间的循环依赖问题。

## What Changes

- 将 `utils/` 目录下的所有文件（`error.ts`, `state.ts`, `validator.ts`, `router.ts`, `server-adapter.ts`）合并到 `main.ts`
- 删除 `utils/` 目录
- 更新 `index.ts` 仅从 `main.ts` 导出
- 在 `main.ts` 内使用清晰的代码分区注释（section comments）组织代码，确保可读性

## Capabilities

### New Capabilities

- `single-file-organization`: 定义单文件代码组织的规范和最佳实践，包括代码分区、注释约定和可读性准则

### Modified Capabilities

（无现有规范需要修改）

## Impact

- **代码结构**: `packages/core/` 目录将从 7 个 TypeScript 文件简化为 2 个（`main.ts` 和 `index.ts`）
- **测试**: 测试文件的 import 路径需要更新
- **外部 API**: 无变化，所有公开导出保持不变
- **插件**: 插件系统不受影响，因为它们通过 `index.ts` 导入
