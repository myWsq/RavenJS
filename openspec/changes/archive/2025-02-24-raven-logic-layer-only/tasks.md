# Tasks: Raven Logic-Layer Refactoring

## 1. Core Refactoring

- [x] 1.1 移除 Raven 类中的 `server` 属性、`listen()` 和 `stop()` 方法
- [x] 1.2 将 `handleRequest` 重命名为 `handle`
- [x] 1.3 移除对 `Bun.serve` 的依赖及相关类型引用
- [x] 1.4 导出 `FetchHandler` 类型别名（可选，设计文档建议）

## 2. Test Updates

- [x] 2.1 将所有 `app.handleRequest` 调用替换为 `app.handle`
- [x] 2.2 移除或调整依赖 `listen()`/`stop()` 的测试（若有）

## 3. Benchmark Updates

- [x] 3.1 将 benchmark 中的 `handleRequest` 调用替换为 `handle`

## 4. Documentation

- [x] 4.1 更新 modules/core/README.md：移除 listen/stop 描述，说明 Raven 为逻辑层
- [x] 4.2 在 README 中添加 Bun.serve 接入示例：`Bun.serve({ fetch: app.handle, port: 3000 })`
- [x] 4.3 更新根目录 README（若涉及 listen/stop 描述）

## 5. Spec Sync

- [x] 5.1 将 delta spec 同步到 openspec/specs/core-framework/spec.md
- [x] 5.2 更新 spec 与文档的运行时定位：Bun-only → 推荐 Bun，Node 18+ 理论上可用；handle 可在任意 Fetch 兼容环境使用
