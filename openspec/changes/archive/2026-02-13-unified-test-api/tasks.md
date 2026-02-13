## 1. 基础搭建

- [x] 1.1 创建 `packages/testing` 目录及其结构
- [x] 1.2 创建 `packages/testing/package.json` 并配置基本信息

## 2. 核心实现

- [x] 2.1 在 `packages/testing/index.ts` 中实现运行时环境检测逻辑
- [x] 2.2 实现并导出兼容 `bun:test` 和 `vitest` 的测试原语
- [x] 2.3 确保 TypeScript 类型定义的正确性

## 3. 验证与测试

- [x] 3.1 创建验证测试文件 `packages/testing/tests/api.test.ts`
- [x] 3.2 使用 `bun test` 运行验证
- [x] 3.3 使用 `vitest` 运行验证
