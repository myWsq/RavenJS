## 1. 创建 utils/scoped-token.ts

- [x] 1.1 创建 `packages/main/utils/scoped-token.ts` 文件
- [x] 1.2 迁移 `runScoped` 函数到新文件
- [x] 1.3 迁移 `ScopedToken` 类到新文件
- [x] 1.4 迁移 `createScopedToken` 函数到新文件

## 2. 修改 index.ts

- [x] 2.1 从 `packages/main/index.ts` 中移除 `runScoped` 导出
- [x] 2.2 从 `packages/main/index.ts` 中移除 `ScopedToken` 类导出
- [x] 2.3 从 `packages/main/index.ts` 中移除 `createScopedToken` 函数导出
- [x] 2.4 保留 `ContextToken` 在 `index.ts` 中

## 3. 更新导入路径

- [x] 3.1 检查并更新所有从 `index.ts` 导入 scoped-token 的代码

## 4. 验证

- [x] 4.1 运行测试确保功能正常
