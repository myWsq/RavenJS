## 1. 架构调整与重构

- [x] 1.1 定义 `ServerAdapter` 接口以抽象服务器行为
- [x] 1.2 在 `packages/main/index.ts` 中引入环境检测逻辑
- [x] 1.3 重构 `Raven` 类，使其通过适配器持有服务器实例

## 2. 运行时实现

- [x] 2.1 实现 `BunAdapter`（封装 `Bun.serve`）
- [x] 2.2 实现 `NodeAdapter`（封装 `node:http` 并处理 `Request`/`Response` 转换）
- [x] 2.3 确保 `Context` 对象在两种环境下都能正确映射字段

## 3. 测试与验证

- [x] 3.1 在 `package.json` 中添加 Node.js 运行测试的脚本
- [x] 3.2 更新现有测试，确保它们在 Bun 和 Node.js 下都能通过
- [x] 3.3 验证 `app.stop()` 在两种环境下的正常关闭逻辑
