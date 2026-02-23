# OVERVIEW

RavenJS JTD Validator 是一个基于 JSON Type Definition (JTD) 标准的数据验证模块参考实现，提供类型安全的请求验证。

**核心思想**：这是一份参考代码，不是一个你需要 import 的 npm 包。你可以直接复制、修改、学习这份代码，然后用在你的项目中。

**主要功能**：
- 类型安全（编译时类型推断）
- 基于 JTD 标准（RFC 8927）
- 多源验证（支持 Body、Query、Params、Headers）
- 链式 API（支持 optional() 和 nullable() 修饰符）

---

# HOW TO READ THIS CODE

建议按以下顺序阅读：

1. **先看整体结构**：浏览 main.ts 的 SECTION 注释，了解代码组织方式
2. **理解类型定义**：看 SECTION: Types，理解核心数据结构
3. **学习 Schema DSL**：看 SECTION: Schema Builder，理解 J 是怎么构建的
4. **看验证逻辑**：看 SECTION: Validation，理解验证是怎么执行的
5. **最后看 Hooks**：看 SECTION: Validation Hooks，理解 useBody 等是怎么工作的

**关键文件**：
- `main.ts` - 所有核心代码都在这里（单文件组织）
- `index.ts` - 导出声明

---

# CORE CONCEPTS

## J
JTD Schema 构建器，用于创建验证 schema。

## Schema
JTD 格式的 schema 对象，用于描述数据结构。

## Validation Hooks
- `useBody(schema)` - 验证请求体
- `useQuery(schema)` - 验证查询参数
- `useParams(schema)` - 验证路径参数
- `useHeaders(schema)` - 验证请求头

## Infer
从 Schema 推断 TypeScript 类型。

---

# ARCHITECTURE

代码采用**单文件组织**，所有核心逻辑都在 `main.ts` 中，按 SECTION 注释分组：

```
main.ts
├── SECTION: Imports
├── SECTION: Types
├── SECTION: Schema Builder
├── SECTION: Validation
└── SECTION: Validation Hooks
```

---

# DESIGN DECISIONS

## 为什么用 JTD 而不是 JSON Schema？

选择 JTD 的原因：
1. **更简单**：JTD 比 JSON Schema 更轻量
2. **类型推断**：更容易映射到 TypeScript 类型
3. **功能足够**：对于 API 验证场景来说功能完整

替代方案考虑：
- 方案 A：JSON Schema → rejected，太复杂了
- 方案 B：自定义 schema 格式 → rejected，没必要重新发明轮子

## 为什么在 beforeHandle 阶段自动验证？

验证在 `beforeHandle` 阶段自动执行，不需要手动调用验证函数。这样做的好处：
- Handler 代码更干净
- 验证失败时自动返回 400 错误
- 专注于业务逻辑

---

# KEY CODE LOCATIONS

## 类型定义
- 行 12-60：核心类型（JTDType、JTDSchema、FieldSchema 等）

## Schema Builder
- 行 63-200+：Schema 构建器实现
- 关键方法：`J.string()`、`J.object()`、`optional()`、`nullable()`

## 验证逻辑
- 行 200+：验证函数实现
- 关键函数：`validate()`

## 验证 Hooks
- 行 300+：`useBody()`、`useQuery()`、`useParams()`、`useHeaders()`

---

# EXTENSION POINTS

如果你想扩展这个模块，可以考虑：

1. **添加自定义验证函数**：在验证逻辑中添加自定义验证
2. **添加跨字段验证**：支持多个字段之间的验证
3. **添加异步验证**：支持异步验证函数
4. **添加更多类型**：在 J 中添加更多 schema 类型

---

# USAGE EXAMPLES

## 基本用法

```typescript
import { J, useBody } from "./raven/jtd-validator/index.ts";

const UserSchema = J.object({
  name: J.string(),
  email: J.string(),
  age: J.int().optional(),
});

app.post("/users", () => {
  const user = useBody(UserSchema);
  return new Response(JSON.stringify(user));
});
```

## 查询参数验证

```typescript
import { J, useQuery } from "./raven/jtd-validator/index.ts";

app.get("/items", () => {
  const { page, limit } = useQuery(J.object({
    page: J.int(),
    limit: J.int().optional(),
  }));
  return new Response(`Page ${page}, Limit ${limit ?? 10}`);
});
```

## 路径参数验证

```typescript
import { J, useParams } from "./raven/jtd-validator/index.ts";

app.get("/user/:id", () => {
  const { id } = useParams(J.object({
    id: J.string(),
  }));
  return new Response(`User ${id}`);
});
```

## 嵌套对象验证

```typescript
const AddressSchema = J.object({
  city: J.string(),
  country: J.string(),
});

const UserSchema = J.object({
  name: J.string(),
  address: AddressSchema,
});

app.post("/submit", () => {
  const data = useBody(UserSchema);
  return new Response("OK");
});
```

## 数组验证

```typescript
const ItemsSchema = J.array(J.object({
  id: J.string(),
  quantity: J.int(),
}));

app.post("/order", () => {
  const items = useBody(ItemsSchema);
  return new Response("OK");
});
```

## 枚举验证

```typescript
const StatusSchema = J.enum(["pending", "approved", "rejected"]);

app.post("/status", () => {
  const status = useBody(J.object({
    status: StatusSchema,
  }));
  return new Response("OK");
});
```

## 类型推断

```typescript
import { J, type Infer } from "./raven/jtd-validator/index.ts";

const UserSchema = J.object({
  name: J.string(),
  age: J.int().optional(),
});

type User = Infer<typeof UserSchema>;
// Equivalent to: { name: string; age?: number }
```
