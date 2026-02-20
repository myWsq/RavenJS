## Context

当前 `J` helper 的 API 直接映射 JTD 的数据结构，需要显式写 `properties` / `optionalProperties` 嵌套：

```typescript
J.object({
  properties: { name: J.string() },
  optionalProperties: { avatar: J.string() },
})
```

这导致：
1. 书写繁琐，嵌套层级深
2. 无法表达 `nullable`（值可为 null）
3. `optional` 和字段定义分离，不直观

## Goals / Non-Goals

**Goals:**
- 提供扁平化的 `J.object()` API，直接传入字段定义
- 支持 `.optional()` 链式方法标记可选字段
- 支持 `.nullable()` 链式方法标记可空值（使用 AJV JTD 原生的 `nullable: true`）
- 保持完整的 TypeScript 类型推断能力
- 保持与现有 JTD 验证逻辑的兼容性

**Non-Goals:**
- 不考虑向后兼容旧 API（breaking change）
- 不添加 JTD 规范之外的验证能力（如 pattern, min/max）
- 不改变底层验证引擎（仍使用 AJV JTD 模式）

## Decisions

### Decision 1: 使用 Symbol 标记 optional 状态

使用 Symbol 作为内部标记，避免污染 schema 输出：

```typescript
const OPTIONAL = Symbol("optional");

interface FieldSchema {
  [OPTIONAL]?: true;
  // ... schema properties
}
```

**Rationale**: Symbol 不会被 JSON 序列化，不影响最终 JTD schema 结构。

### Decision 2: nullable 直接使用 JTD 原生支持

AJV 的 JTD 实现已支持 `nullable: true` 属性，直接在 schema 中添加即可：

```typescript
{ type: "string", nullable: true }
```

**Rationale**: 利用现有能力，无需额外处理逻辑。

### Decision 3: 链式调用返回新对象

`.optional()` 和 `.nullable()` 返回新对象而非修改原对象：

```typescript
const str = J.string();
const optStr = str.optional();  // 新对象
str !== optStr  // true
```

**Rationale**: 不可变设计，避免意外副作用，允许复用基础类型定义。

### Decision 4: J.object() 自动分离 properties/optionalProperties

`J.object()` 接收扁平字段定义，内部自动根据 `OPTIONAL` 标记分离：

```typescript
J.object({
  name: J.string(),
  avatar: J.string().optional(),
})
// 输出:
// {
//   properties: { name: { type: "string" } },
//   optionalProperties: { avatar: { type: "string" } }
// }
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking change 影响现有代码 | 用户确认不考虑兼容，一次性迁移 |
| 复杂嵌套场景的类型推断可能有边界问题 | 编写充分的测试用例覆盖嵌套场景 |
| Symbol 在某些调试场景不易观察 | 可通过 `Symbol.for()` 改用可调试的 Symbol（如需要） |
