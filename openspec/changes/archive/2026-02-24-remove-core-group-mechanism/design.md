## Context

Core 当前通过 `group()` 创建子 Raven 实例，子实例共享同一 RadixRouter、累加 prefix，并形成 parent-child 链。AppState 的 `get()` 沿 parent 链向上查找；hooks 通过 `getAllHooks()` 聚合当前实例及所有父实例的钩子。该设计引入嵌套与继承，增加心智负担和实现复杂度。

## Goals / Non-Goals

**Goals:**
- 移除 group 机制，实现无嵌套的扁平设计
- 简化 Raven 类：无 parent、无 prefix 累加、无 `group()` 方法
- 简化 AppState：仅查询当前实例，无 parent 链查找
- 简化 hooks：仅使用当前实例注册的钩子，无聚合逻辑
- 保持路由、请求处理、状态管理（单实例 scope）等核心能力不变

**Non-Goals:**
- 不提供替代的路由前缀方案（用户自行在路径中写 `/api/v1/...`）
- 不考虑向后兼容或迁移指南
- 不修改 RequestState、Plugin、DI 等其他机制

## Decisions

### D1: 移除 `Raven.group()` 及 parent-chain 相关字段

- **选择**: 完全删除 `group()` 方法；`RavenInstance.parent` 改为 `null` 且不再接受外部传入；构造函数移除 `prefix`、`parent`、`router` 参数。
- **备选**: 保留 group 但标记废弃 → 与目标不符。
- **理由**: 简化 API 和类型，消除嵌套心智模型。

### D2: AppState 仅查询当前实例

- **选择**: `AppState.get()` 只从 `currentAppStorage.getStore()?.internalStateMap` 读取，不再 `while (current) { current = current.parent }` 向上查找。
- **备选**: 保留继承但简化实现 → 仍依赖 parent，无法真正简化。
- **理由**: 单实例 scope 足够覆盖参考实现的使用场景。

### D3: Hooks 仅使用实例自身注册的钩子

- **选择**: 删除 `getAllHooks()`，路由的 pipeline 及 handleRequest/handleError 中直接使用 `this.hooks[type]`。
- **备选**: 保留聚合但限定单层 → 与移除 parent 冲突。
- **理由**: 与扁平设计一致，消除递归逻辑。

### D4: 路由注册路径不再累加 prefix

- **选择**: `addRoute` 中 `fullPath` 直接等于传入的 `path`，不再使用 `this.prefix + path`。
- **理由**: 用户通过完整路径注册，如 `app.get('/api/v1/users', handler)`。

### D5: RavenInstance 接口简化

- **选择**: `RavenInstance` 中 `parent` 字段移除，或保留为 `null` 以兼容类型引用。若外部无直接依赖 `parent`，建议删除。
- **理由**: 类型与实现一致，避免误导。

## Risks / Trade-offs

- **[Risk]** 无法通过 group 复用前缀 → **Mitigation**: 用户用变量或辅助函数拼接路径，如 `const api = '/api/v1'; app.get(`${api}/users`, ...)`。
- **[Risk]** AppState 无法在「逻辑子域」间共享 → **Mitigation**: 本 change 明确不考虑兼容，单实例 scope 为设计目标。
- **[Risk]** benchmark/state.bench 依赖 parent 参数 → **Mitigation**: 修改 benchmark 使用单实例，移除 parent 相关测试分支。
