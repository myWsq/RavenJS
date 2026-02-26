## Context

当前 `Plugin<S>` 泛型设计要求插件的 State 必须在工厂函数闭包内创建并通过 `states` 字段声明，再由 `register()` 返回给调用方。这导致：

1. State 无法作为模块顶层 export 被其他模块静态引用
2. 同一插件注册多次时，调用方需要对每个 `register()` 返回的 states 元组分别管理引用
3. `State.set()` 依赖 `AsyncLocalStorage` 的隐式上下文传播，调用方在错误上下文执行时会静默写入错误 Scope
4. `Plugin<S>` 泛型在 TypeScript 中繁琐，所有使用方都需要感知 `S` 类型

目标：静态声明 State，显式 Scope 访问，通过 Setter 注入保证写入安全性。

## Goals / Non-Goals

**Goals:**

- State 可在模块顶层声明并 export，消费方可直接 `import { DBState } from 'sqlPlugin'`
- 同一 Plugin 注册到不同 Scope 时，通过 `State.in(scopeKey)` 显式访问各 Scope 的值
- State 对消费者只读，唯一写入途径为 `load(app, set)` 参数中的 `StateSetter`
- AppState 和 RequestState 均支持 Scope 隔离
- Plugin 接口简化，移除泛型和 `states` 字段

**Non-Goals:**

- 不提供嵌套 Scope（Scope 是扁平的 string | symbol key）
- 不提供 Scope 枚举或运行时列出所有 Scope 的能力
- 不实现 Scope 之间的状态继承或回退（global 不作为 "S1" 的 fallback）
- 不保持与旧 Plugin API 的向后兼容

## Decisions

### 决策 1：移除 `ScopedState.set()`，引入 `StateSetter`

**选择**：

```typescript
type StateSetter = <T>(state: ScopedState<T>, value: T) => void;

interface Plugin {
  name: string;
  load(app: Raven, set: StateSetter): void | Promise<void>;
}
```

`StateSetter` 是一个 scope 绑定的写入函数，在 `register()` 调用时由框架创建并传入 `load()`。它在闭包里持有 `scopeKey`，无论被传递到哪里（包括 hook 闭包），都始终写入正确的 Scope。

**备选**：保留 `set()`，但在 `register()` 执行期间通过 `AsyncLocalStorage` 传播 scopeKey，`set()` 内部读取当前 scope context。

**否决理由**：ALS 隐式传播在 hook 场景下失效——`beforeHandle` 等 hook 在请求时执行，此时早已脱离 `register()` 的 ALS context。保留 `set()` 意味着需要双套机制（load 阶段用 ALS，请求阶段用 Setter），反而更复杂。

---

### 决策 2：Setter 在 hook 闭包中的使用

`load()` 中注册的 hook 可以捕获 `set` 参数：

```typescript
load(app, set) {
  const db = connect()
  set(DBState, db)                         // AppState，load 时执行

  app.beforeHandle(() => {
    const tx = db.beginTx()
    set(TxState, tx)                       // RequestState，请求时执行
  })
}
```

`set` 函数在 hook 执行时仍然 scope 正确：AppState 写入 app 的 scopedStateMaps，RequestState 写入当前 request 的 scopedRequestMaps。框架在 hook 回调内自动感知 request context（通过现有的 `requestStorage` ALS）。

---

### 决策 3：双层 Map 替换单层 Map

**AppState 存储**（当前 `Raven.internalStateMap`）：

```
旧：Map<symbol, any>
新：Map<ScopeKey, Map<symbol, any>>
```

`Raven.internalStateMap` 废弃，改为 `Raven.scopedStateMaps`。

**RequestState 存储**（当前 `requestStorage`）：

```
旧：AsyncLocalStorage<Map<symbol, any>>
新：AsyncLocalStorage<Map<ScopeKey, Map<symbol, any>>>
```

`ScopeKey = string | symbol`。框架定义 `GLOBAL_SCOPE = Symbol('raven:global')` 作为无 scopeKey 时的默认键。这是 module-level 常量，不导出给用户。

---

### 决策 4：`ScopedState.in(scopeKey)` 的实现

`in()` 返回一个 `ScopedState<T>` 视图，读取时绕过隐式上下文，固定从指定 scope 读取：

```typescript
abstract class ScopedState<T> {
  private _views = new Map<string | symbol, ScopedState<T>>();

  public in(scopeKey: string | symbol): ScopedState<T> {
    if (!this._views.has(scopeKey)) {
      this._views.set(scopeKey, this._createView(scopeKey));
    }
    return this._views.get(scopeKey)!;
  }

  protected abstract _createView(scopeKey: string | symbol): ScopedState<T>;
}
```

`AppStateScopedView` 和 `RequestStateScopedView` 实现 `get()` 时直接使用持有的 `scopeKey` 查找，不依赖任何 ALS。

**`in()` 链式重置**：视图的 `in()` 代理回 root state，确保 `DBState.in("S1").in("S2") === DBState.in("S2")`：

```typescript
class AppStateScopedView<T> extends ScopedState<T> {
  constructor(private root: AppState<T>, private scope: string | symbol) { ... }

  public in(key: string | symbol): ScopedState<T> {
    return this.root.in(key)   // 代理回 root，维护全局缓存
  }
}
```

---

### 决策 5：`AppState.get()` 的默认读取 Scope

`AppState.get()`（无 `.in()`）读取 `GLOBAL_SCOPE`：

```typescript
public get(): T | undefined {
  const app = currentAppStorage.getStore()
  return app?.scopedStateMaps.get(GLOBAL_SCOPE)?.get(this.symbol)
}
```

不依赖任何"当前 scope context"ALS——因为 ALS 不再传播 scopeKey。读取总是显式的：global 用 `.get()`，scoped 用 `.in(key).get()`。

---

### 决策 6：框架内部状态的写入方式

`RavenContext`、`ParamsState`、`QueryState`、`BodyState`、`HeadersState` 是框架自有 `RequestState`，在 `processStates()` 中由框架写入 GLOBAL_SCOPE。

使用 module 内私有函数 `internalSet`：

```typescript
// 不 export，仅 core module 内部使用
function internalSet<T>(state: ScopedState<T>, value: T): void {
  // 直接写入 GLOBAL_SCOPE，绕过 StateSetter 机制
  if (state instanceof AppState) {
    const app = currentAppStorage.getStore();
    if (!app) throw RavenError.ERR_STATE_CANNOT_SET(state.name);
    getOrCreateScopeMap(app.scopedStateMaps, GLOBAL_SCOPE).set(state.symbol, value);
  } else if (state instanceof RequestState) {
    const reqMap = requestStorage.getStore();
    if (!reqMap) throw RavenError.ERR_STATE_CANNOT_SET(state.name);
    getOrCreateScopeMap(reqMap, GLOBAL_SCOPE).set(state.symbol, value);
  }
}
```

---

### 决策 7：Plugin 接口简化

```typescript
interface Plugin {
  name: string
  load(app: Raven, set: StateSetter): void | Promise<void>
}

function definePlugin(plugin: Plugin): Plugin  // identity，无泛型

async register(plugin: Plugin, scopeKey?: string): Promise<void>
```

`states` 字段完全移除。`register()` 返回 `Promise<void>`，不再支持链式调用（符合现有设计，之前已是 `Promise<S>`）。

---

### 决策 8：StateSetter 不约束可设置的 State 范围

**选择**：`StateSetter` 接受任意 `ScopedState<T>`，不在类型层面限制只能设置"插件声明的" State。

**备选**：`Plugin` 保留 `states` 字段，`StateSetter` 泛型约束为只能设置 `states` 里声明的 State，形成强所有权语义。

**否决理由**：`states` 的所有权约束在 TypeScript 上实现繁琐（需要 infer + conditional types），且无实质运行时保证。移除 `states` 字段后，插件间 State 的"所有权"通过约定（State 声明在插件模块内）而非类型系统约束，足够清晰。

## Risks / Trade-offs

- **`requestStorage` 结构变更**：从单层 Map 改为双层 Map，所有读取路径（`RequestState.get()`、`RequestState.in().get()`、`internalSet`）必须同步更新，漏改处会静默返回 `undefined` → 测试覆盖需完整。
- **Setter 只在 `load()` 及其闭包内有效**：用户若将 `set` 传递到异步任务（如 `setTimeout`、Promise chain），仍然可以正确写入 scope，但如果在没有 requestStorage context 的环境调用 RequestState 的 setter，会拿到 undefined map 并静默失败或抛出 → 文档需明确说明。
- **`internalStateMap` 废弃**：`RavenInstance` 接口中 `internalStateMap` 的移除是 public interface 变更，使用 `RavenInstance` 类型的外部代码会受影响（当前无外部用户，可接受）。
- **`State.set()` 移除后无法在 beforeHandle 等 hook 中"自由"写入 State**：用户必须在 `load()` 时注册 hook 并捕获 `set` 参数，不能在 hook 注册和 `set` 调用之间"自由传递"State 引用来写入——这是有意设计的约束，但会改变一些使用模式。
