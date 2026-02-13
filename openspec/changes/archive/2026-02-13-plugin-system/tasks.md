## 1. 基础架构重构 (Core Infrastructure Refactor)

- [x] 1.1 重构 `Raven` 类以支持分层结构，添加 `parent` 引用
- [x] 1.2 在 `Raven` 类中添加 `plugins` 存储

## 2. 插件系统核心实现 (Plugin System Core)

- [x] 2.1 定义 `Plugin` 类型及其相关接口
- [x] 2.2 实现 `register` 方法，支持同步和异步插件注册
- [x] 2.3 实现插件作用域隔离逻辑（创建子实例）
- [x] 2.4 实现 `raven-plugin` 辅助工具（或类似机制）以支持全局插件

## 3. 生命周期钩子集成 (Lifecycle Hooks Integration)

- [x] 3.1 重构钩子存储，使其在分层实例中独立存在
- [x] 3.2 更新 `handleRequest` 逻辑，使其能够从当前作用域向上回溯并执行所有相关的生命周期钩子
- [x] 3.3 验证插件内部注册的钩子是否按预期触发（隔离性验证）

## 4. 测试与验证 (Testing and Verification)

- [x] 4.1 编写基础插件注册测试
- [x] 4.2 编写异步插件初始化测试
- [x] 4.3 编写插件作用域隔离测试（钩子不干扰全局）
