## 1. 核心类型定义

- [x] 1.1 定义生命周期钩子的函数类型（OnRequestHook, BeforeHandleHook, BeforeResponseHook, OnErrorHook）
- [x] 1.2 在 `Raven` 类中定义 `hooks` 存储结构

## 2. 钩子注册 API

- [x] 2.1 实现 `onRequest` 注册方法
- [x] 2.2 实现 `beforeHandle` 注册方法
- [x] 2.3 实现 `beforeResponse` 注册方法
- [x] 2.4 实现 `onError` 注册方法

## 3. 请求处理管道重构

- [x] 3.1 在 `handleRequest` 中实现 `onRequest` 钩子链的执行逻辑
- [x] 3.2 在 `handleRequest` 中实现 `beforeHandle` 钩子链的执行逻辑
- [x] 3.3 在 `handleRequest` 中实现 `beforeResponse` 钩子链的执行逻辑
- [x] 3.4 封装全局错误处理逻辑，集成 `onError` 钩子

## 4. 测试与验证

- [x] 4.1 编写单元测试验证钩子的执行顺序
- [x] 4.2 验证钩子的“短路”逻辑（直接返回 Response）
- [x] 4.3 验证 `onError` 能够捕获各阶段的异常并返回正确响应
