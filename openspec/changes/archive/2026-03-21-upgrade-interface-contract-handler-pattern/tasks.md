## 1. Contract Helper 基础能力

- [x] 1.1 新增 frontend-safe 的 contract helper 模块，定义 contract 类型、HTTP method 类型、`defineContract` 与最小 `InferContract*` 推导工具
- [x] 1.2 让 contract helper 的 request/response 推导基于 Standard Schema input/output 工作，并覆盖 `.default()`、`.transform()` 等输入输出不对称场景
- [x] 1.3 从 frontend-safe 子入口公开 contract helper，并在 `packages/core/index.ts` 中补充对应的公共导出映射

## 2. Contract 路由注册能力

- [x] 2.1 实现 `registerContractRoute(app, contract, handler)`，根据 `contract.method` 分派到 `app.get/post/put/delete/patch`
- [x] 2.2 确保 `registerContractRoute` 与 `withSchema(contract.schemas, ...)` 配合时保留现有请求校验、response 校验与 fallback 生命周期行为
- [x] 2.3 为 contract helper 与 route registration 增加单元测试 / 类型测试，覆盖 method dispatch、request input 推导与 response output 推导

## 3. Pattern 与学习文档收敛

- [x] 3.1 更新 `packages/core/pattern/overview.md`、`conventions.md`、`layer-responsibilities.md`、`runtime-assembly.md`，把默认 interface 结构改为每接口一个目录的 `contract.ts` / `handler.ts` 模式
- [x] 3.2 更新 `packages/core/README.md`、`packages/core/GUIDE.md`，并在需要时更新 `packages/core/pattern/anti-patterns.md`，明确 frontend 直接 import contract value、`contract.ts` frontend-safe 边界，以及 `registerContractRoute` 的推荐用法
- [x] 3.3 通过全文检索移除官方文档中把单文件 `*.interface.ts` 或 `index.ts` 聚合作为默认推荐方案的口径

## 4. 验证与一致性检查

- [x] 4.1 运行相关测试与类型检查，确认新公开 API、输入输出推导和 route registration helper 行为一致
- [x] 4.2 复核受影响文档与示例，确认 `contract.ts` 是 transport contract 与 route metadata 的唯一来源，`handler.ts` 只承担 `withSchema(contract.schemas, ...)` 业务编排，`app.ts` 仍是唯一 composition root
