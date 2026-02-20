## Why

Benchmark 结果显示 Ajv JTD Parser 的性能并不比 `JSON.parse + validate` 高，这打破了之前将 Schema 验证逻辑紧耦合到 Core 的性能假设。当前 `@ravenjs/core` 直接依赖 Ajv，包含 JTD Schema DSL（J.object 等）、类型推断（Infer<T>）、HandlerBuilder、以及验证执行逻辑，导致：

1. Core 包体积膨胀，即使用户不需要 Schema 验证也必须引入 Ajv
2. 强制使用 JTD Schema，无法灵活选用其他验证库（Zod、Valibot 等）
3. 验证时机固定在 processStates 阶段，缺乏灵活性

## What Changes

将 JTD Schema 验证逻辑从 Core 完全抽离，创建独立的 `@ravenjs/jtd-validator` 包：

- **Core 瘦身**：移除 Ajv 依赖、J.object() DSL、Infer<T> 类型、HandlerBuilder、runValidator 等
- **Core 职责单一化**：processStates 只做 State 赋值，不执行验证
- **新包承载验证**：`@ravenjs/jtd-validator` 提供 J.* DSL、Infer<T>、以及 `useBody(schema)` 等验证版 hooks
- **Lazy Validation**：验证发生在 `useBody(schema)` 调用时（获取时验证），而非赋值时

## Capabilities

### New Capabilities

- `jtd-validator-package`：独立的 JTD Schema 验证包，提供 Schema DSL 和验证版 hooks

### Modified Capabilities

- `handler-schema-validation`：规格需更新，反映验证逻辑已移至独立包，Core 不再负责验证

## Impact

- `packages/core/main.ts`：大幅精简，删除约 200 行 JTD/验证相关代码
- `packages/core/package.json`：移除 ajv 依赖
- 新增 `packages/jtd-validator/` 目录及完整实现
- 现有使用 `useBody(schema)` 的代码需从 `@ravenjs/jtd-validator` 导入
- Benchmark 测试需更新导入路径
