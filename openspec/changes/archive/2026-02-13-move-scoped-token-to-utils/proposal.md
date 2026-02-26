## Why

当前 scoped-token 相关功能（`ScopedToken` 类、`createScopedToken` 函数和 `runScoped` 函数）定义在 `packages/main/index.ts` 中，与核心框架类 `Raven` 放在一起。根据项目的编码规范，可复用的工具函数应该放在独立的 `utils/` 目录中，因此需要将 scoped-token 相关功能移入 utils。

## What Changes

1. 创建新文件 `packages/main/utils/scoped-token.ts`
2. 将 `ScopedToken` 类、`createScopedToken` 函数和 `runScoped` 函数从 `packages/main/index.ts` 移至新文件
3. 从 `packages/main/index.ts` 中移除这些导出
4. 保持 `ContextToken` 在 `index.ts` 中，因为它是框架核心的 Context 令牌

## Capabilities

### New Capabilities

- 无新 capabilities

### Modified Capabilities

- 无修改 existing capabilities（这是重构任务，不改变需求规范）

## Impact

- `packages/main/index.ts` - 移除 scoped-token 相关代码，保留 `ContextToken`
- `packages/main/utils/scoped-token.ts` - 新增文件，包含 scoped-token 功能
- 所有使用 `ScopedToken`、`createScopedToken`、`runScoped` 的代码需要更新导入路径
