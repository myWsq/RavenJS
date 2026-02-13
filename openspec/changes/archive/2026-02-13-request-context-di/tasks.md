## 1. 架构简化与重构

- [x] 1.1 移除 `AsyncScope` 类，改为模块私有的 `AsyncLocalStorage` 实例
- [x] 1.2 实现 `runScoped` 全局导出函数
- [x] 1.3 更新 `ScopedToken` 类以直接访问内部存储

## 2. 框架集成与 Context Token 化

- [x] 2.1 更新 `packages/main/index.ts` 中的 `handleRequest` 以使用 `runScoped()`
- [x] 2.2 声明 `ContextToken` 并将 `Context` 实例注入异步作用域

## 3. 测试验证

- [x] 3.1 编写 `packages/main/tests/scoped-token.test.ts` 验证 `ScopedToken` 核心机制
- [x] 3.2 验证并发隔离、嵌套作用域以及 `ContextToken` 行为
