## ADDED Requirements

### Requirement: 扁平化 Schema 定义 (Flattened Schema Definition)

开发者 SHALL 能够使用扁平化的 `J.object()` API 定义对象 schema，无需显式写 `properties` / `optionalProperties` 嵌套结构。

#### Scenario: 定义包含必填和可选字段的对象

- **WHEN** 调用 `J.object({ name: J.string(), avatar: J.string().optional() })`
- **THEN** 生成的 JTD schema SHALL 为 `{ properties: { name: { type: "string" } }, optionalProperties: { avatar: { type: "string" } } }`

#### Scenario: 定义全部必填字段的对象

- **WHEN** 调用 `J.object({ id: J.int(), name: J.string() })`
- **THEN** 生成的 JTD schema SHALL 仅包含 `properties`，不包含 `optionalProperties`

#### Scenario: 定义全部可选字段的对象

- **WHEN** 调用 `J.object({ bio: J.string().optional(), avatar: J.string().optional() })`
- **THEN** 生成的 JTD schema SHALL 仅包含 `optionalProperties`，不包含 `properties`

### Requirement: Optional 字段标记 (Optional Field Marker)

所有基础类型方法（`J.string()`, `J.int()` 等）SHALL 返回支持 `.optional()` 链式调用的对象。

#### Scenario: 标记字符串字段为可选

- **WHEN** 调用 `J.string().optional()`
- **THEN** 返回的 schema 对象 SHALL 被标记为 optional
- **AND** 在 `J.object()` 中使用时 SHALL 被放入 `optionalProperties`

#### Scenario: 标记嵌套对象为可选

- **WHEN** 调用 `J.object({ ... }).optional()`
- **THEN** 返回的 schema 对象 SHALL 被标记为 optional

#### Scenario: 链式调用不修改原对象

- **WHEN** 先调用 `const str = J.string()` 再调用 `str.optional()`
- **THEN** `str` 本身 SHALL 保持为非 optional
- **AND** `.optional()` SHALL 返回一个新的 optional schema 对象

### Requirement: Nullable 值支持 (Nullable Value Support)

所有基础类型方法 SHALL 返回支持 `.nullable()` 链式调用的对象，生成带 `nullable: true` 的 JTD schema。

#### Scenario: 标记字符串字段值可为 null

- **WHEN** 调用 `J.string().nullable()`
- **THEN** 生成的 JTD schema SHALL 为 `{ type: "string", nullable: true }`

#### Scenario: 组合使用 optional 和 nullable

- **WHEN** 调用 `J.string().optional().nullable()`
- **THEN** 字段 SHALL 同时被标记为 optional 和 nullable
- **AND** 生成的 JTD schema SHALL 为 `{ type: "string", nullable: true }`
- **AND** 该字段 SHALL 被放入 `optionalProperties`

#### Scenario: nullable 和 optional 顺序无关

- **WHEN** 调用 `J.string().nullable().optional()`
- **THEN** 效果 SHALL 与 `J.string().optional().nullable()` 相同

### Requirement: 类型推断支持 (Type Inference Support)

`Infer<T>` 类型工具 SHALL 正确推断 optional 和 nullable 组合的 TypeScript 类型。

#### Scenario: 推断必填非空字段

- **WHEN** 定义 `const schema = J.object({ name: J.string() })`
- **THEN** `Infer<typeof schema>` SHALL 等于 `{ name: string }`

#### Scenario: 推断可选非空字段

- **WHEN** 定义 `const schema = J.object({ name: J.string().optional() })`
- **THEN** `Infer<typeof schema>` SHALL 等于 `{ name?: string }`

#### Scenario: 推断必填可空字段

- **WHEN** 定义 `const schema = J.object({ name: J.string().nullable() })`
- **THEN** `Infer<typeof schema>` SHALL 等于 `{ name: string | null }`

#### Scenario: 推断可选可空字段

- **WHEN** 定义 `const schema = J.object({ name: J.string().optional().nullable() })`
- **THEN** `Infer<typeof schema>` SHALL 等于 `{ name?: string | null }`
