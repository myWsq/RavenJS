# OVERVIEW

RavenJS Core 是一个轻量级、高性能的 Web 框架参考实现，设计用于 Bun 和 Node.js 运行时。

**核心思想**：这是一份参考代码，不是一个你需要 import 的 npm 包。你可以直接复制、修改、学习这份代码，然后用在你的项目中。

**主要功能**：
- 统一的 HTTP 服务器 API（自动适配 Bun 和 Node.js）
- 基于 Radix 树的路由系统（支持路径参数和路由组）
- 作用域状态管理（AppState 和 RequestState）
- 生命周期钩子（onRequest、beforeHandle、beforeResponse、onError）
- 插件系统

---

# HOW TO READ THIS CODE

建议按以下顺序阅读：

1. **先看整体结构**：浏览 main.ts 的 SECTION 注释，了解代码组织方式
2. **理解类型定义**：看 SECTION: Types & Interfaces，理解核心数据结构
3. **学习错误处理**：看 SECTION: Error Handling，了解错误是怎么处理的
4. **理解状态管理**：看 SECTION: State Management，理解 AsyncLocalStorage 的使用
5. **看路由系统**：看 SECTION: Routing，理解 Radix 树的实现
6. **看服务器适配器**：看 SECTION: Server Adapters，理解 Bun/Node.js 适配
7. **最后看核心类**：看 SECTION: Raven Class，理解整体流程

**关键文件**：
- `main.ts` - 所有核心代码都在这里（单文件组织）
- `index.ts` - 导出声明

---

# CORE CONCEPTS

## Raven
主应用类，用于创建和管理服务器。

## Context
请求上下文对象，包含 request、params、query 等信息。

## ScopedState
用于在异步边界之间共享数据的作用域状态。
- `AppState` - 应用级别状态，整个应用共享
- `RequestState` - 请求级别状态，每个请求独立
- `BodyState`、`QueryState`、`ParamsState`、`HeadersState` - 预定义状态

## Plugin
用于扩展框架功能的插件函数。

---

# ARCHITECTURE

代码采用**单文件组织**，所有核心逻辑都在 `main.ts` 中，按 SECTION 注释分组：

```
main.ts
├── SECTION: Imports
├── SECTION: Types & Interfaces
├── SECTION: Error Handling
├── SECTION: State Management
├── SECTION: Routing
├── SECTION: Server Adapters
├── SECTION: Context
├── SECTION: Plugin System
├── SECTION: Lifecycle Hooks
└── SECTION: Raven Class
```

**请求处理流程**：
1. `onRequest` 钩子（全局）
2. 路由匹配
3. `beforeHandle` 钩子（路由级别）
4. Handler 执行
5. `beforeResponse` 钩子（路由级别 + 全局）
6. 返回响应

---

# DESIGN DECISIONS

## 为什么用 AsyncLocalStorage？

选择 AsyncLocalStorage 做状态管理的原因：
1. **异步安全**：状态自动通过异步调用链传播
2. **无样板代码**：不需要手动传递 context
3. **高性能**：零拷贝访问，比装饰器或 DI 更轻量

替代方案考虑：
- 方案 A：手动传递 context 对象 → rejected，样板代码太多
- 方案 B：依赖注入容器 → rejected，太重了，性能不好

## 为什么 Handler 不自动接收 Context？

Handler 设计为无参函数的原因：
1. **简单**：只需要返回 Response，不需要理解框架特定类型
2. **灵活**：用户可以用普通函数，不需要学习新范式
3. **通过 State 访问**：需要时可以通过 `BodyState.get()` 等访问

如果需要 Context，可以通过 `RavenContext.getOrFailed()` 获取。

## 为什么用 Radix 树做路由？

选择 Radix 树（压缩前缀树）的原因：
1. **高性能**：查找复杂度 O(k)，k 是路径段数
2. **内存高效**：共享前缀的路径只存储一次
3. **支持参数**：天然支持 `:id` 参数提取

替代方案考虑：
- 方案 A：简单的对象映射 → rejected，不支持参数
- 方案 B：正则表达式匹配 → rejected，性能差

## 为什么做运行时适配？

`BunAdapter` 和 `NodeAdapter` 抽象了运行时差异：
- Bun：使用原生 `Bun.serve()`
- Node.js：使用 `node:http`

用户不需要关心底层实现，框架自动选择合适的适配器。

---

# KEY CODE LOCATIONS

## 错误处理
- 行 47-135：`RavenError` 类和 `isRavenError` 函数
- 关键方法：`toResponse()`、`setContext()`

## 状态管理
- 行 141-142：`currentAppStorage` 和 `requestStorage`（AsyncLocalStorage）
- 行 146-270：`ScopedState`、`AppState`、`RequestState` 类

## 路由系统
- 行 273-400+：`RadixRouter` 类
- 关键方法：`insert()`、`match()`

## 服务器适配器
- 行 403-450：`BunAdapter` 和 `NodeAdapter`
- 关键方法：`listen()`、`stop()`

## 核心类
- 行 500+：`Raven` 类
- 关键方法：`constructor()`、`get()`、`post()`、`listen()`、`stop()`

---

# EXTENSION POINTS

如果你想扩展这个框架，可以考虑：

1. **添加新的状态类型**：继承 `ScopedState` 创建新的状态类
2. **添加新的生命周期钩子**：在 `Raven` 类中添加新的钩子方法
3. **添加新的服务器适配器**：为其他运行时（如 Deno）创建适配器
4. **扩展路由系统**：在 `RadixRouter` 中添加新功能（如通配符、正则匹配）
5. **添加插件**：通过 `createPlugin()` 创建新插件

---

# USAGE EXAMPLES

## 最小示例

```typescript
import { Raven } from "./raven/index.ts";

const app = new Raven();

app.get("/", () => {
  return new Response("Hello, World!");
});

app.listen({ port: 3000 });
```

## 带参数的路由

```typescript
import { Raven } from "./raven/index.ts";

const app = new Raven();

app.get("/user/:id", (ctx) => {
  return new Response(`User ID: ${ctx.params.id}`);
});

app.listen({ port: 3000 });
```

## 路由组

```typescript
import { Raven } from "./raven/index.ts";

const app = new Raven();

app.group("/api", (api) => {
  api.get("/users", () => new Response("Users list"));
  api.post("/users", () => new Response("Create user"));
});

app.listen({ port: 3000 });
```

## 状态管理

```typescript
import { Raven, createAppState, createRequestState } from "./raven/index.ts";

const app = new Raven();

const counterState = createAppState<number>({ name: "counter" });
counterState.set(0);

const userState = createRequestState<User>({ name: "user" });

app.beforeHandle(() => {
  userState.set(await fetchUser());
});

app.get("/profile", () => {
  const user = userState.getOrFailed();
  return new Response(user.name);
});

app.listen({ port: 3000 });
```
