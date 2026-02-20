## Why

当前的 `J` helper API 需要显式写 `properties` 和 `optionalProperties` 嵌套结构，使用体验繁琐。同时缺少对 `nullable` 的支持，无法表达"值可以是 null"的语义。

## What Changes

- **BREAKING**: `J.object()` 不再需要 `properties` / `optionalProperties` 嵌套，直接传入扁平的字段定义
- 所有基础类型方法（`J.string()`, `J.int()` 等）返回可链式调用的对象
- 新增 `.optional()` 方法标记字段为可选（对应 `optionalProperties`）
- 新增 `.nullable()` 方法标记字段值可为 null（对应 JTD 的 `nullable: true`）
- 更新 `Infer<T>` 类型推断以正确处理 optional 和 nullable 组合

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `handler-schema-validation`: 修改 JTD schema builder API，简化 `J` helper 的使用方式，增加 optional/nullable 链式方法支持

## Impact

- `packages/core/main.ts`: JTD 类型定义、`J` helper 实现、`Infer<T>` 类型推断
- `packages/core/tests/validation.test.ts`: 测试用例需要更新为新 API
- `benchmark/micro/validator.bench.ts`: benchmark 代码需要更新为新 API
