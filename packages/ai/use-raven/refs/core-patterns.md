# 核心代码模式

core 模块是 RavenJS 的核心框架，提供 HTTP 服务、路由、hooks、状态管理功能。

## 创建 HTTP 服务

```typescript
import { Raven } from "./raven/main.ts";

const app = new Raven();

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

## 定义路由

```typescript
app.get("/users", async (req) => {
  return { users: [] };
});

app.post("/users", async (req) => {
  const body = await req.json();
  return { id: 1, ...body };
});
```

## 使用 Hooks

```typescript
app.hooks.onRequest((req) => {
  console.log(`Incoming request: ${req.url}`);
});

app.hooks.onResponse((req, res) => {
  console.log(`Response sent: ${res.status}`);
});
```

## 状态管理

```typescript
const state = app.state;

// 创建状态
const counter = state.create("counter", { count: 0 });

// 更新状态
counter.set({ count: counter.get().count + 1 });

// 读取状态
console.log(counter.get());
```

## 请求处理

```typescript
app.get("/greet/:name", async (req) => {
  const { name } = req.params;
  const query = req.query;
  
  return {
    message: `Hello, ${name}!`,
    query,
  };
});
```

## 关键概念

- **Raven** - 主应用类
- **Handler** - 请求处理函数
- **Hooks** - 请求/响应生命周期钩子
- **State** - 应用状态管理
- **Scoped Token** - 状态作用域标识
