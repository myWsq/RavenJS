## Context

Ravenjs 的核心设计理念之一是利用 `ScopedState` (通过 `AsyncLocalStorage`) 来管理请求生命周期内的状态，从而避免在函数间显式传递 `Context` 对象。

为了保持 `@ravenjs/core` 的精简和可扩展性：

- **Core 层**: 仅依赖标准 JSON Schema 规范 + Ajv 进行运行时校验。
- **Plugin 层**: Schema 生成库（TypeBox、Zod、Valibot 等）通过插件机制接入，提供类型推断能力。

## Goals / Non-Goals

**Goals:**

- **Schema Agnostic**: Core 只接受标准 JSON Schema 对象，不与任何特定的 Schema 生成库绑定。
- **State-Driven Validation**: 校验规则作为可选属性定义在 `ScopedState` 上。
- **State Slots**: Handler 通过"插槽"声明它依赖哪些带 Schema 的状态。
- **Modern API**: 工厂函数采用对象参数风格，`name` 为可选属性。
- **Plugin Extensibility**: 通过插件机制支持 TypeBox、Zod 等库，提供更好的 DX 和类型安全。
- **Backward Compatible**: 不带 Schema 的 State 依然按照原有方式工作。

**Non-Goals:**

- 在 core 中引入 TypeBox、Zod 等 Schema 生成库作为依赖。
- 引入新的 `ValidationState` 子类。

## Decisions

### 决策 1: 工厂函数采用对象参数，name 可选

将 `createRequestState` 和 `createAppState` 的签名从位置参数改为对象参数：

```typescript
interface StateOptions {
  name?: string;
  schema?: object; // 标准 JSON Schema
  source?: "body" | "query" | "params" | "header";
}

// 新签名
export function createRequestState<T>(options?: StateOptions): RequestState<T>;
export function createAppState<T>(options?: StateOptions): AppState<T>;
```

当 `name` 未提供时，自动生成唯一标识符（如使用 Symbol 或 UUID）。

### 决策 2: Core 仅依赖标准 JSON Schema + Ajv

`ScopedState` 的 `schema` 属性接受的是标准 JSON Schema 对象（`object` 类型），而不是 TypeBox 的 `TSchema`。这确保了 core 不与任何特定库绑定。

### 决策 3: 使用 Ajv 进行运行时校验

Ajv 是 JSON Schema 生态中最流行、性能最好的校验库。Core 使用 Ajv 编译和执行 JSON Schema 校验。

```typescript
import Ajv from "ajv";
const ajv = new Ajv({ coerceTypes: true, removeAdditional: true });
```

### 决策 4: 类型安全通过插件/上层包装实现

由于 core 只接受 `object` 类型的 schema，类型推断需要由上层实现：

**方案 A: 官方插件包**
提供 `@ravenjs/typebox` 插件包，导出类型安全的包装函数：

```typescript
// @ravenjs/typebox
import { Type, type Static, type TSchema } from "@sinclair/typebox";

export function createTypedRequestState<S extends TSchema>(options: {
  name?: string;
  schema: S;
  source: "body" | "query" | "params";
}): RequestState<Static<S>> {
  return createRequestState({ ...options });
}
```

**方案 B: 用户自行包装**
用户可以自行创建类型安全的工厂函数，将任何 Schema 库与 Raven 集成。

### 决策 5: 保持 `ScopedState` 基类简洁

`ScopedState` 只增加两个可选属性，不引入复杂的泛型约束：

```typescript
export abstract class ScopedState<T> {
  public readonly name?: string;
  public readonly schema?: object;
  public readonly source?: "body" | "query" | "params" | "header";
  // ...
}
```

类型参数 `T` 依然由用户显式指定或由上层插件推断。

## Risks / Trade-offs

- **[Trade-off]** Core 层失去了自动类型推断能力。
  - **Mitigation**: 通过官方插件包（如 `@ravenjs/typebox`）提供开箱即用的类型安全体验。
- **[Risk]** 用户可能直接使用 core 而忘记安装类型安全插件。
  - **Mitigation**: 文档明确推荐使用插件包，并在 `createRequestState` 的 JSDoc 中提示。
- **[Breaking Change]** 工厂函数签名变更。
  - **Mitigation**: 这是新功能，当前 API 尚未稳定，可以直接调整。

## Migration Plan

1. 在 `packages/core/package.json` 中添加 `ajv` 依赖。
2. 在 `packages/core/utils/state.ts` 中：
   - 修改 `ScopedState` 构造函数，接受对象参数。
   - 修改 `createAppState` 和 `createRequestState` 签名为对象参数风格。
3. 在 `packages/core/main.ts` 中实现 Slot 探测和 Ajv 校验逻辑。
4. 创建 `packages/typebox` 插件包，提供 TypeBox 集成和类型安全的工厂函数。
