## 1. Raven 类与 RavenInstance 接口

- [x] 1.1 从 RavenInstance 接口移除 `parent` 字段
- [x] 1.2 从 Raven 类移除 `parent`、`prefix` 字段及构造函数中的 `prefix`、`parent`、`router` 参数
- [x] 1.3 移除 `Raven.group()` 方法

## 2. AppState 与 Hooks

- [x] 2.1 简化 AppState.get()：仅从当前实例 internalStateMap 读取，移除 parent 链递归查找
- [x] 2.2 移除 `getAllHooks()` 方法，路由 pipeline 及 handleRequest/handleError 直接使用 `this.hooks[type]`
- [x] 2.3 在 `addRoute` 中将 `fullPath` 直接设为传入的 `path`，移除 prefix 累加
- [x] 2.4 在 `listen` 中移除对 `this.parent?.server` 的检查

## 3. 单元测试

- [x] 3.1 移除 routing.test.ts 中 group 与 prefix 累加相关用例
- [x] 3.2 移除或重构 state.test.ts 中 AppState 继承（parent chain）相关用例

## 4. Benchmark 与文档

- [x] 4.1 更新 benchmark/micro/state.bench.ts：移除 parent 参数，使用单实例
- [x] 4.2 更新 modules/core/README.md：删除 group 相关描述，说明路由需使用完整路径
