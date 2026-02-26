## Why

当前的 `createHandler` API 存在冗余：

1. 需要在 `StateOptions` 中指定 `source` 字段
2. 需要通过 `{ slots: [...] }` 对象包装来声明依赖
3. `slots` 是一个内部实现概念，对用户来说不够语义化

用户需要更直观的方式来声明 Handler 依赖哪些请求数据（body/query/params/headers），而不是理解 "slot" 这个抽象概念。

## What Changes

- **REMOVAL**: 删除 `StateSource` 类型和 `StateOptions.source` 字段
- **REMOVAL**: 删除 `CreateHandlerOptions` 接口和 `Handler.slots` 属性
- **MODIFICATION**: 简化 `createHandler` 签名为 `createHandler(fn)`
- **NEW**: 在 `Handler` 类型上添加 `body`、`query`、`params`、`headers` 四个可选属性
- **MODIFICATION**: 修改 `processSlots` 逻辑，根据 handler 的属性名确定数据来源

## Capabilities

### Modified Capabilities

- `state-management`: 简化 State 定义，移除 source 字段
- `handler-schema-validation`: 用固定属性名替代 slots 机制

## Impact

- `packages/core/main.ts`:
  - 删除 `StateSource` 类型
  - 修改 `StateOptions` 接口，移除 `source` 字段
  - 修改 `ScopedState` 类，移除 `source` 属性
  - 修改 `Handler` 类型，用 `body/query/params/headers` 替代 `slots`
  - 简化 `createHandler` 函数
  - 修改 `processSlots` 函数逻辑
