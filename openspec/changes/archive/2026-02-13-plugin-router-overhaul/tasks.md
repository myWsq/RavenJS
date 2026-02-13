## 1. 核心系统重构 (Core System Refactor)

- [x] 1.1 更新 `packages/core/main.ts` 中的 `Plugin` 类型定义为工厂兼容模式
- [x] 1.2 重构 `Raven.register` 方法，移除 `opts` 参数并实现直接调用插件函数
- [x] 1.3 更新 `createPlugin` 辅助函数以匹配新的类型定义

## 2. Context 与路由处理逻辑优化 (Context & Routing Overhaul)

- [x] 2.1 调整 `packages/core/main.ts` 中的 `handleRequest` 流程，将 `Context` 组装移至路由匹配之后
- [x] 2.2 优化 `Context` 类构造函数，确保 `params` 和 `query` 正确存储
- [x] 2.3 确保 `onRequest` 钩子仅接收 `Request` 对象，且明确其在 Context 组装前的地位

## 3. 官方插件适配 (Official Plugins Adaptation)

- [x] 3.1 更新 `packages/plugins/router/index.ts` 以适配新的插件工厂模式
- [x] 3.2 检查并确保官方插件包的依赖关系正确（指向 workspace:*）

## 4. 测试与验证 (Verification)

- [x] 4.1 更新核心库中受影响的单元测试（如插件注册测试）
- [x] 4.2 编写新的集成测试，验证路由参数在 `Context` 中的正确提取
- [x] 4.3 验证官方插件注册流程是否正常工作
