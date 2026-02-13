## 1. 路由基础设施 (Routing Infrastructure)

- [x] 1.1 在 `utils/router.ts` 中实现 `RadixRouter` 类，支持 `add` 和 `find` 方法
- [x] 1.2 支持静态路径、路径参数（`:name`）和通配符匹配
- [x] 1.3 编写 `RadixRouter` 的单元测试

## 2. 框架集成 (Framework Integration)

- [x] 2.1 更新 `Context` 接口，添加 `params` 和 `query` 属性
- [x] 2.2 在 `Raven` 类中引入 `RadixRouter` 实例
- [x] 2.3 实现 `get`, `post`, `put`, `delete`, `patch` 等快捷方法
- [x] 2.4 实现 `group` 方法，支持路由嵌套和前缀管理

## 3. 生命周期逻辑重构 (Lifecycle Refactor)

- [x] 3.1 调整 `handleRequest` 流程：首先执行全局 `onRequest` 钩子
- [x] 3.2 在 `onRequest` 之后执行路由匹配，并组装完整的 `Context`
- [x] 3.3 实现基于路由匹配结果的钩子回溯执行（或使用“预编译”钩子链）
- [x] 3.4 处理 404 情况：如果路由未匹配，执行 `onError` 或返回默认 404 响应

## 4. 验证与测试 (Verification & Testing)

- [x] 4.1 编写路径参数提取测试
- [x] 4.2 编写查询参数提取测试
- [x] 4.3 编写路由组及其作用域钩子测试
- [x] 4.4 验证 `Context` 组装时机（确保 `onRequest` 时 `params` 不可用，`beforeHandle` 时可用）
