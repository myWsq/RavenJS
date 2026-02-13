## Context

为了极致简化 API 表面积，我们移除显式的 `AsyncScope` 管理类。开发者只需要关注如何定义 `ScopedToken` 以及在何处使用 `runScoped` 启动作用域。

## Goals / Non-Goals

**Goals:**
- **极简 API**: 消除单例模式和显式的存储管理类。
- **令牌驱动**: 所有的上下文操作都通过 `ScopedToken` 完成。
- **自动初始化**: 在 `runScoped` 中自动创建存储 Map。

## Decisions

### 1. 内部存储
在 `index.ts` 中定义一个私有的 `AsyncLocalStorage` 实例，不导出给外部，仅供内部函数使用。

### 2. `runScoped` 函数
```typescript
export function runScoped<R>(callback: () => R): R {
  return internalStorage.run(new Map(), callback);
}
```

### 3. `ScopedToken<T>` 类
直接引用 `internalStorage` 获取当前作用域的 Map。

### 4. 核心 Context Token 化
将 `Context` 接口作为 `ScopedToken` 声明，使得在处理请求的任何异步节点都可以直接通过 `ContextToken.get()` 获取当前请求的完整上下文，无需手动透传。

## Risks / Trade-offs

- **[Trade-off] 隐式管理** → 存储引擎变得不可见，虽然更简洁，但如果未来需要对底层存储进行精细控制（如自定义存储结构），可能需要重新引入包装类。*Mitigation*: 目前的需求下，`Map` 已经足够强大。
