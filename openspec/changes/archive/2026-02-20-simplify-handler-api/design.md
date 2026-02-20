## Context

Ravenjs 使用无参 Handler 设计 `() => Response`，所有请求数据通过 `ScopedState` 获取。当前实现中，Handler 通过属性声明依赖的 State，State 同时承担存储和 Schema 声明的职责。

这种设计存在概念混淆：State 本应只负责"存什么"，却同时承担了"怎么验证"的职责。每个 Handler 都需要创建独立的 State 实例，代码冗长。

## Goals / Non-Goals

**Goals:**
- 分离关注点：State 只负责存储，Schema 直接传递给 Handler
- 提供流畅的链式 API：`createHandler().bodySchema().handle()`
- 使用 JTD 替代 JSON Schema，利用 ajv 的 parse 能力提升性能
- 在 Builder 阶段预编译 validator/parser，避免运行时编译开销
- 保持无参 Handler 设计哲学

**Non-Goals:**
- 引入有参 Handler `(ctx) => Response`
- 向后兼容旧 API（全新设计）

## Decisions

### 决策 1: 分离 State 和 Schema

Core 提供公共单例 State，Schema 直接传递给 Handler：

```
┌─────────────────────────────────────────────────────────────┐
│  Before: State 承担双重职责                                  │
├─────────────────────────────────────────────────────────────┤
│  const BodyState = createRequestState<T>({                  │
│    schema: { ... }  // State 携带 schema                    │
│  });                                                        │
│  handler.body = BodyState;  // 传 State                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  After: 职责分离                                             │
├─────────────────────────────────────────────────────────────┤
│  // Core 提供公共 State                                      │
│  export const BodyState = createRequestState<unknown>();    │
│                                                             │
│  // Schema 直接传给 Handler                                  │
│  handler.bodySchema = MySchema;                             │
└─────────────────────────────────────────────────────────────┘
```

### 决策 2: Builder 链式 API

使用 Builder 模式替代属性赋值，提供流畅的链式调用：

```typescript
class HandlerBuilder {
  private _bodySchema?: JTDSchema;
  private _bodyParser?: JTDParser;
  private _querySchema?: JTDSchema;
  private _queryValidator?: ValidateFunction;
  // ...

  bodySchema(schema: JTDSchema): this {
    this._bodySchema = schema;
    this._bodyParser = ajv.compileParser(schema);  // 预编译
    return this;
  }

  querySchema(schema: JTDSchema): this {
    this._querySchema = schema;
    this._queryValidator = ajv.compile(schema);
    return this;
  }

  paramsSchema(schema: JTDSchema): this { ... }
  headersSchema(schema: JTDSchema): this { ... }

  handle(fn: HandlerFn): Handler {
    const handler = fn as Handler;
    handler.bodySchema = this._bodySchema;
    handler.bodyParser = this._bodyParser;
    handler.querySchema = this._querySchema;
    handler.queryValidator = this._queryValidator;
    // ...
    return handler;
  }
}

export function createHandler(): HandlerBuilder {
  return new HandlerBuilder();
}
```

使用方式：

```typescript
app.post("/users",
  createHandler()
    .bodySchema(CreateUserBody)
    .querySchema(PaginationQuery)
    .handle(() => {
      const body = useBody(CreateUserBody);
      const query = useQuery(PaginationQuery);
      return new Response(JSON.stringify({ user: body.name }));
    })
);

// 简单 handler
app.get("/health",
  createHandler().handle(() => new Response("OK"))
);
```

### 决策 3: 使用 JTD 替代 JSON Schema

选择 JTD (JSON Type Definition) 作为 Schema 格式，利用 Ajv 的 `compileParser` 实现高性能解析：

```
┌─────────────────────────────────────────────────────────────┐
│  JSON Schema 方式（两步）                                    │
├─────────────────────────────────────────────────────────────┤
│  text ──▶ JSON.parse() ──▶ validate() ──▶ data              │
│           ~~~~~慢~~~~~     ~~~~慢~~~~                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  JTD Parser 方式（一步）                                     │
├─────────────────────────────────────────────────────────────┤
│  text ──▶ jtdParser() ──▶ data                              │
│           ~~~~快~~~~                                         │
│  一步完成 parse + validate，生成优化过的专用代码              │
└─────────────────────────────────────────────────────────────┘
```

JTD 的限制（可接受）：
- 无 minimum/maximum（数值范围验证）
- 无 pattern（正则验证）
- 无 format（email, uri 等格式验证）
- 复杂业务验证可在 handler 中实现

JTD Schema 示例：

```typescript
// 对象
{
  properties: {
    name: { type: "string" },
    age: { type: "int32" }
  },
  optionalProperties: {
    email: { type: "string" }
  }
}

// 数组
{ elements: { type: "string" } }

// 枚举
{ enum: ["admin", "user", "guest"] }
```

### 决策 4: 预编译优化

在 Builder 的链式调用阶段（应用启动时）预编译 validator/parser，避免请求时的编译开销：

```typescript
// 启动时编译
createHandler()
  .bodySchema(schema)     // → ajv.compileParser(schema)
  .querySchema(schema)    // → ajv.compile(schema)
  .handle(...)

// 请求时直接使用已编译的 parser
if (handler.bodyParser) {
  const data = handler.bodyParser(text);  // 直接调用，无查找开销
  if (data === undefined) {
    throw RavenError.ERR_VALIDATION("Invalid request body");
  }
  BodyState.set(data);
}
```

### 决策 5: 在 Core 内置 JTD Builder

直接在 `@ravenjs/core` 中提供 JTD schema 构建和类型推断，无需额外包：

```typescript
// packages/core/main.ts 或 packages/core/jtd.ts
export const J = {
  string: () => ({ type: "string" as const }),
  boolean: () => ({ type: "boolean" as const }),
  number: () => ({ type: "float64" as const }),
  int: () => ({ type: "int32" as const }),
  timestamp: () => ({ type: "timestamp" as const }),
  
  enum: <T extends readonly string[]>(values: T) => ({ enum: values }),
  array: <T extends JTDSchema>(schema: T) => ({ elements: schema }),
  object: <P, O>(props: { properties?: P; optionalProperties?: O }) => props,
};

// 类型推断
export type Infer<T extends JTDSchema> = /* ... */;
```

使用示例：

```typescript
import { J, type Infer, useBody } from "@ravenjs/core";

const CreateUserBody = J.object({
  properties: {
    name: J.string(),
    age: J.int(),
  },
  optionalProperties: {
    email: J.string(),
  },
});

type CreateUserBodyType = Infer<typeof CreateUserBody>;
// { name: string; age: number; email?: string }
```

### 决策 6: 处理流程调整

```
Request
  │
  ▼
onRequest hooks
  │
  ▼
processStates ◀── 在 beforeHandle 之前完成 parse + validate
  │                 │
  │                 ├─ bodyParser(text) → BodyState
  │                 ├─ queryValidator(query) → QueryState  
  │                 ├─ paramsValidator(params) → ParamsState
  │                 └─ headersValidator(headers) → HeadersState
  ▼
beforeHandle hooks ◀── 可以访问已验证的 State
  │
  ▼
handler() ◀── useBody(schema) 从 BodyState 获取类型安全数据
  │
  ▼
beforeResponse hooks
  │
  ▼
Response
```

## Risks / Trade-offs

- **[Trade-off]** JTD 功能比 JSON Schema 少
  - **Mitigation**: JTD 覆盖了 HTTP API 验证的常见场景，复杂业务验证可在 handler 中实现

- **[Trade-off]** 需要维护自建的 JTD Builder
  - **Mitigation**: JTD 格式简单稳定，维护成本低

- **[Risk]** Schema 需要传递两次（bodySchema 和 useBody）
  - **Mitigation**: 使用同一个 schema 变量，确保一致性

## Migration Plan

1. 在 Core 内实现 JTD Builder（`J`）和类型推断（`Infer`）
2. 修改 Core 使用 `ajv/dist/jtd` 入口
3. 创建公共单例 State：`BodyState`, `QueryState`, `ParamsState`, `HeadersState`
4. 实现 `HandlerBuilder` 类和链式 API
5. 修改 `processStates` 使用预编译的 parser/validator
6. 实现 `useBody`, `useQuery`, `useParams`, `useHeaders` 函数
7. 更新导出和测试用例
8. 删除旧的 typebox 插件
