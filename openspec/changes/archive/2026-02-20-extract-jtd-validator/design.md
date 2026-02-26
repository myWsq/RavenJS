## Context

RavenJS 是基于 Bun 的高性能 TypeScript Web 框架。当前 `packages/core/main.ts` 包含完整的 JTD Schema 验证逻辑：Ajv 依赖、J.object() DSL、Infer<T> 类型推断、HandlerBuilder、以及在 processStates 中执行验证。

Benchmark 测试结果显示 Ajv JTD Parser 性能并不优于 `JSON.parse + validate`，之前基于性能考虑的紧耦合设计不再合理。需要将验证逻辑抽离为独立包，实现关注点分离。

## Goals / Non-Goals

**Goals:**

- Core 完全移除 Ajv 依赖和 Schema 验证逻辑
- 创建独立的 `@ravenjs/jtd-validator` 包承载所有 JTD 相关功能
- 实现 Lazy Validation：在 `useBody(schema)` 获取时验证，而非 processStates 赋值时
- 保持类型安全：`useBody(schema)` 返回正确推断的类型

**Non-Goals:**

- 不兼容旧 API（不需要 deprecation path）
- 不支持其他验证库（Zod、Valibot 等，可后续扩展）
- 不实现验证结果缓存（首次实现保持简单）

## Decisions

### 1. Core 只保留 State 机制，完全移除验证逻辑

**移除清单**：

- `import Ajv from "ajv/dist/jtd"`
- `OPTIONAL` symbol 及相关类型
- `FieldSchema`, `JTDSchema`, `JTDType`, `JTDBaseSchema` 类型
- `createField()`, `J` 对象
- `Infer<T>` 及所有 InferXxx 类型
- `HandlerBuilder` 类和 `createHandler()` 函数
- Handler 类型上的 `bodySchema`, `bodyValidator` 等属性
- `runValidator()` 方法
- `processStates()` 中的验证调用

**保留清单**：

- `ScopedState`, `AppState`, `RequestState` 类
- `BodyState`, `QueryState`, `ParamsState`, `HeadersState` 实例
- `processStates()` 只做 JSON 解析和 State 赋值

### 2. 新包结构设计

```
packages/jtd-validator/
├── main.ts          # 核心实现
├── index.ts         # 公共 API 导出
├── package.json
└── tests/
    └── validator.test.ts
```

**导出 API**：

```typescript
// Schema DSL
export { J, OPTIONAL };
export type { FieldSchema, JTDSchema, Infer };

// 验证版 Hooks
export { useBody, useQuery, useParams, useHeaders };
```

### 3. Lazy Validation 实现

```typescript
// packages/jtd-validator/main.ts

import Ajv, { type ValidateFunction } from "ajv/dist/jtd";
import { BodyState, RavenError } from "@ravenjs/core";

const ajv = new Ajv();
const validatorCache = new WeakMap<object, ValidateFunction>();

function getOrCompileValidator(schema: object): ValidateFunction {
  let validator = validatorCache.get(schema);
  if (!validator) {
    validator = ajv.compile(schema);
    validatorCache.set(schema, validator);
  }
  return validator;
}

export function useBody<T extends FieldSchema>(schema: T): Infer<T> {
  const data = BodyState.getOrFailed();
  const validator = getOrCompileValidator(schema.schema);

  if (!validator(data)) {
    const errors = validator.errors ?? [];
    const message = errors
      .map((e) => `${e.instancePath || "/"}: ${e.message || "invalid"}`)
      .join("; ");
    throw RavenError.ERR_VALIDATION(message || "Invalid body");
  }

  return data as Infer<T>;
}
```

**关键点**：

- ValidateFunction 使用 WeakMap 缓存，同一 schema 只编译一次
- 验证失败抛出 `RavenError.ERR_VALIDATION`，复用 Core 错误处理机制
- 同一请求多次调用 `useBody(schema)` 会重复验证（简单优先，性能影响可忽略）

### 4. Handler 类型简化

**Before (Core)**：

```typescript
export type Handler = HandlerFn & {
  bodySchema?: JTDSchema;
  bodyValidator?: ValidateFunction<unknown>;
  // ...
};
```

**After (Core)**：

```typescript
export type Handler = () => Response | Promise<Response>;
```

用户定义 Handler 无需 `createHandler()` 链式调用，直接写函数：

```typescript
app.post("/users", () => {
  const body = useBody(CreateUserSchema); // 从 @ravenjs/jtd-validator 导入
  return Response.json({ id: 1, ...body });
});
```

## Risks / Trade-offs

**[Trade-off] 验证时机变化**：从 processStates 提前验证变为 useBody 时验证。如果 Handler 在验证前有副作用代码，验证失败时副作用已执行。
→ 这是合理的：Handler 应该先获取/验证数据，再执行业务逻辑。

**[Trade-off] 多次调用重复验证**：同一请求内多次 `useBody(schema)` 会重复验证。
→ 验证本身极快（~1μs），影响可忽略。如需优化可后续添加请求级缓存。

**[Risk] 用户迁移成本**：需要更新导入路径。
→ 改动明确，搜索替换即可。且明确不需要兼容旧 API。
