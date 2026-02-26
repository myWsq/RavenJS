## Context

当前 RavenJS 的错误处理存在以下问题：

1. **错误定义分散**：代码中直接使用 `throw new Error("message")` 抛出的错误消息硬编码，缺乏统一管理
2. **错误码缺失**：没有错误码系统，难以实现精确的错误定位
3. **错误上下文不足**：无法携带额外的调试信息或业务上下文

## Goals / Non-Goals

**Goals:**

- 创建统一的错误类 `RavenError`，支持错误码、上下文数据
- 定义错误码规范，使用 `ERR_XXX` 字符串格式
- 每个错误类型对应一个静态方法
- 提供 `setContext()` 方法用于后续添加上下文
- 更新现有代码，使用标准化错误类替代裸 `Error`

**Non-Goals:**

- 不修改现有的 `onError` 钩子接口（保持向后兼容）
- 不实现错误国际化 (i18n) 功能

## Decisions

### Decision 1: 错误创建 API

**选择:** 使用静态方法 `RavenError.ERR_XXX()` 创建错误

**示例:**

```typescript
RavenError.ERR_SERVER_ALREADY_RUNNING();
RavenError.ERR_SCOPED_TOKEN_NOT_INITIALIZED("tokenName");
```

**理由:**

- 语义清晰，方法名即错误类型
- TypeScript 类型安全
- 易于 IDE 自动补全

### Decision 2: 上下文管理

**选择:** 提供 `setContext()` 方法用于后续添加上下文

**理由:**

- 简化静态方法签名，不需要每次都传 context
- 灵活，可以在需要时再添加上下文

### Decision 3: 文件组织

**选择:** 在 `packages/main/utils/error.ts` 单文件中实现

**理由:**

- 简化文件结构，便于维护
- 集中管理所有错误相关代码

## Migration Plan

1. **Phase 1: 核心实现**
   - 创建 `RavenError` 类
   - 实现静态错误创建方法
   - 实现 `setContext()` 方法

2. **Phase 2: 集成**
   - 更新 `scoped-token.ts` 使用新错误类
   - 更新 `index.ts` 服务器重复启动错误

3. **Phase 3: 验证**
   - 验证现有测试仍然通过
