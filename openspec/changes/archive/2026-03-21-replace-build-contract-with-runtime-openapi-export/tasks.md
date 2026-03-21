## 1. Route Manifest 与冲突检测

- [x] 1.1 在 `packages/core/app` 中为 app 引入可枚举的 route manifest，并在 route 注册时保存 method、原始 path、规范化 path、handler 与可选 contract metadata
- [x] 1.2 在统一 route 注册入口实现 `method + path shape` 冲突检测，覆盖相同路径重复注册与仅参数名不同的 shape 冲突
- [x] 1.3 扩展 `registerContractRoute(...)`，使其在注册 route 的同时把 contract metadata 关联到 app route manifest
- [x] 1.4 为 route manifest 与冲突检测补充单元测试，覆盖普通重复路由、`/orders/:id` 与 `/orders/:orderId` 冲突、以及 contract route 成功登记

## 2. Runtime OpenAPI Export

- [x] 2.1 将现有 OpenAPI emitter 所需的最小逻辑迁移到 core runtime 可复用位置，并改为从 app route manifest 读取 contract routes
- [x] 2.2 为 `Raven` 增加 `app.exportOpenAPI(options?)` API，支持默认 `/openapi.json` 与自定义 path / info 配置
- [x] 2.3 实现 exporter 的 dirty-cache / 重新生成机制，确保 `ready()` 期间注册的 contract routes 会出现在导出文档中
- [x] 2.4 实现导出阶段的 Standard JSON Schema 检查：不可导出的 contract operation 整体跳过并输出包含 method、path、原因的 warning
- [x] 2.5 为 runtime OpenAPI export 补充测试，覆盖默认路径、自定义路径、plugin/load 阶段新增 route、以及 warning + skip 行为

## 3. 移除 Build Contract 工作流

- [x] 3.1 删除 `packages/cli` 中的 `build-contract` 命令、隐藏快照子命令与对应的实现文件
- [x] 3.2 删除 `build-contract` 相关 e2e/fixture 测试，并把仍有价值的 OpenAPI 映射断言迁移到 runtime exporter 场景
- [x] 3.3 清理 core 中只为 contract artifact bundle / standalone build 服务的过时类型、导出与辅助逻辑，保留 runtime exporter 仍需复用的部分

## 4. 文档与学习路径迁移

- [x] 4.1 更新 `packages/core/README.md`、`GUIDE.md` 与 `pattern/*`，把 OpenAPI 暴露推荐路径改为 `app.exportOpenAPI(...)`
- [x] 4.2 移除文档中对 `raven build-contract`、独立 contract package、`raven-contract.json` / `openapi.json` / `openapi.yml` 产物工作流的描述
- [x] 4.3 更新相关示例与说明，明确 OpenAPI 文档的真相源是“当前 app 实际注册成功的 contract routes”
