## Why

Core 当前通过 `group()` 和 parent-child 嵌套实现路由分组与前缀累加，导致实现复杂度高（RavenInstance.parent、prefix 累加、getAllHooks 聚合、AppState 递归查找等）。移除 group 机制可保持无嵌套的简单设计，降低心智负担和代码复杂度，且无需考虑向后兼容。

## What Changes

- **BREAKING** 移除 `Raven.group(prefix, callback)` 方法
- **BREAKING** 移除 `RavenInstance.parent` 与 prefix 累加机制
- **BREAKING** 移除 AppState 沿 parent 链的继承查找
- **BREAKING** 移除 hooks 沿 parent 链的聚合逻辑
- 路由注册仅支持扁平路径，由用户自行拼接前缀（如 `app.get('/api/v1/...', ...)`）
- AppState 与 hooks 仅作用于当前 Raven 实例，无父子继承

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `core-framework`: 移除「路由组」Requirement；修改 AppState 行为，移除「AppState inheritance」Scenario（不再支持 parent 链查找）

## Impact

- 受影响代码：`modules/core/index.ts`
- 受影响测试：`tests/unit/core/routing.test.ts`（group 相关用例）、`tests/unit/core/state.test.ts`（AppState 继承用例）、`benchmark/micro/state.bench.ts`
- API：`Raven` 类移除 `group()`，`RavenInstance` 移除 `parent`，构造函数移除 `prefix`、`parent`、`router` 参数
