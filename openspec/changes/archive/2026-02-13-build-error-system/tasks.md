## 1. 错误系统实现

- [x] 1.1 创建 `packages/main/utils/error.ts` - 统一的错误系统文件
- [x] 1.2 实现 `RavenError` 基类 - 支持消息模板、上下文、错误链
- [x] 1.3 实现错误码常量 `ErrorCodes` - `ERR_XXX` 格式
- [x] 1.4 实现 `createError` 工厂函数
- [x] 1.5 添加预定义错误工厂函数

## 2. 现有代码迁移

- [x] 2.1 更新 `packages/main/utils/scoped-token.ts` 使用新的错误类
- [x] 2.2 更新 `packages/main/index.ts` 服务器重复启动错误使用新的错误类

## 3. 测试验证

- [x] 3.1 验证现有测试仍然通过
