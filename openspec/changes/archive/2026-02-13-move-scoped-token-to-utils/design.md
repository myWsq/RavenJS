## Context

当前 `ScopedToken` 类、`createScopedToken` 函数和 `runScoped` 函数定义在 `packages/main/index.ts` 中，与核心框架类 `Raven` 耦合在一起。根据项目编码规范，可复用的工具函数应放在独立的 `utils/` 目录中。

## Goals / Non-Goals

**Goals:**

- 将 scoped-token 相关功能移入 `packages/main/utils/scoped-token.ts`
- 保持现有功能不变，只做代码迁移
- 更新相关导入路径

**Non-Goals:**

- 不修改 scoped-token 的功能逻辑
- 不改变 API 接口
- `ContextToken` 继续保留在 `index.ts` 中

## Decisions

1. **创建 utils/scoped-token.ts** - 将 scoped-token 相关代码移至新文件
   - 包含 `ScopedToken` 类、`createScopedToken` 函数和 `runScoped` 函数
   - 使用相对路径导入 `storage`

2. **修改 index.ts** - 移除 scoped-token 相关导出
   - 保留 `ContextToken` 导出，因为它代表框架核心的 Context

3. **更新导入路径** - 所有使用这些 API 的代码需要更新导入

## Risks / Trade-offs

- [Risk] 可能有其他文件直接依赖 `index.ts` 的 scoped-token 导出
  - **Mitigation**: 搜索所有导入，更新为从 `utils/scoped-token` 导入

## Migration Plan

1. 创建 `packages/main/utils/scoped-token.ts`，迁移代码
2. 修改 `packages/main/index.ts`，移除已迁移的导出
3. 更新所有导入路径
4. 运行测试确保功能正常

## Open Questions

无
