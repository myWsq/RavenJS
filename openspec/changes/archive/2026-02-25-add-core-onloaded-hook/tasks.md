## 1. Core Hook API and Lifecycle Wiring

- [x] 1.1 在 `modules/core` 的 `Raven` 核心实现中新增 `onLoaded` hook 类型与内部存储队列
- [x] 1.2 新增 `app.onLoaded(hook)` 注册方法，并在公共导出与类型定义中暴露该 API
- [x] 1.3 在插件加载完成后的初始化收尾阶段接入 `onLoaded` 执行链，确保按注册顺序串行 `await`
- [x] 1.4 增加一次性触发保护，保证同一次初始化流程内 `onLoaded` 只触发一次

## 2. Error and Async Behavior

- [x] 2.1 为 `onLoaded` 执行链实现错误传播逻辑：hook 抛错时中断后续执行并向上传递
- [x] 2.2 对齐现有异步语义，确保 `onLoaded` 返回 Promise 时被正确等待
- [x] 2.3 复核 `register` 与现有请求生命周期路径，确保新增逻辑不改变既有行为契约

## 3. Tests and Validation

- [x] 3.1 在 `modules/core/tests` 新增/更新测试，覆盖“全部插件加载后触发 onLoaded”场景
- [x] 3.2 新增异步执行顺序测试，验证多个 `onLoaded` hooks 串行执行
- [x] 3.3 新增错误场景测试，验证抛错时中断并上抛
- [x] 3.4 新增重复触发保护测试，验证同一次初始化流程不重复执行
