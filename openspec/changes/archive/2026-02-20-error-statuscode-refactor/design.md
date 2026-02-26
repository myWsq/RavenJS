## Context

当前 `RavenError` 的 HTTP 状态码存储在 `ErrorContext.status` 中：

```typescript
export interface ErrorContext {
  status?: number;
  [key: string]: unknown;
}
```

这种设计存在问题：

1. `status` 与通用上下文混合，语义不明确
2. 类型检查不够严格（通过索引签名访问时类型为 `unknown`）
3. 构建错误响应时需要从 context 中提取状态码

## Goals / Non-Goals

**Goals:**

- 将 `statusCode` 作为 `RavenError` 的一级属性
- 保持 `ErrorContext` 作为纯粹的扩展上下文
- 简化 `toResponse()` 的实现
- 提供更清晰的类型定义

**Non-Goals:**

- 不改变错误的创建方式（仍使用工厂方法）
- 不修改 `ErrorContext` 的索引签名功能
- 不改变错误处理钩子的行为

## Decisions

### Decision 1: statusCode 作为可选属性，默认 500

**选择**: `statusCode` 为可选属性，`toResponse()` 中默认使用 500

**理由**:

- 并非所有错误都需要 HTTP 状态码（如内部逻辑错误）
- 500 作为服务端错误的通用默认值符合 HTTP 语义
- 保持向后兼容，现有工厂方法可以不传 statusCode

**备选方案**:

- 必填属性：增加所有错误工厂方法的复杂度
- 默认 400：不符合服务端错误的语义

### Decision 2: 构造函数接受 statusCode 参数

**选择**: 在私有构造函数中添加 `statusCode` 参数

```typescript
private constructor(code: string, message: string, context: ErrorContext, statusCode?: number)
```

**理由**:

- 工厂方法可以灵活传递 statusCode
- 保持构造函数私有，强制使用工厂模式

### Decision 3: 移除 ErrorContext.status

**选择**: 完全移除 `ErrorContext` 中的 `status` 属性

**理由**:

- 避免两处定义状态码造成混淆
- 强制迁移到新 API

## Risks / Trade-offs

**[Breaking Change]** → 这是破坏性变更，使用 `context.status` 的代码将失效。由于这是内部重构，影响范围可控。

**[迁移成本]** → 需要更新所有使用 `context.status` 的地方。搜索代码库确认影响点后再实施。
