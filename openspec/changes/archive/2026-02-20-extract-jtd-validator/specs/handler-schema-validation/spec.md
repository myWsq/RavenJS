# handler-schema-validation Specification

## Purpose

该规范定义了 Raven 框架的 Handler Schema 校验机制。校验逻辑由独立的 `@ravenjs/jtd-validator` 包提供，Core 只负责 State 赋值，不执行验证。开发者通过 `useBody(schema)` 等 hooks 在获取数据时触发验证（Lazy Validation）。

## Requirements

### Requirement: Core 只做 State 赋值 (Core State Assignment Only)

`@ravenjs/core` 的 `processStates()` SHALL 只负责解析请求数据并赋值到对应 State，不执行任何 Schema 验证。

#### Scenario: Body 数据赋值

- **WHEN** 收到带有 JSON Body 的 POST 请求
- **THEN** Core SHALL 使用 `request.json()` 解析请求体
- **AND** 将解析后的数据通过 `BodyState.set(data)` 赋值
- **AND** 不执行任何 Schema 验证

#### Scenario: Query 参数赋值

- **WHEN** 收到带有查询参数的请求
- **THEN** Core SHALL 将 `url.searchParams` 转换为对象并通过 `QueryState.set(query)` 赋值

### Requirement: Lazy Validation (获取时验证)

`@ravenjs/jtd-validator` 包 SHALL 提供 `useBody`, `useQuery`, `useParams`, `useHeaders` hooks，在调用时执行 Schema 验证。

#### Scenario: useBody 验证成功

- **WHEN** Handler 调用 `useBody(schema)` 且 Body 数据符合 Schema
- **THEN** SHALL 返回已验证的数据，类型为 `Infer<typeof schema>`

#### Scenario: useBody 验证失败

- **WHEN** Handler 调用 `useBody(schema)` 且 Body 数据不符合 Schema
- **THEN** SHALL 抛出 `RavenError.ERR_VALIDATION` 错误
- **AND** 错误信息 SHALL 包含 Ajv 校验错误的详细信息

#### Scenario: Body JSON 解析失败

- **WHEN** 请求 Body 不是有效的 JSON 格式
- **THEN** Core SHALL 在 `processStates()` 阶段抛出 `RavenError.ERR_BAD_REQUEST`
- **AND** 不会执行到 Handler 内的 `useBody()` 调用

### Requirement: Validator 编译缓存 (Validator Compilation Caching)

`@ravenjs/jtd-validator` SHALL 缓存已编译的 ValidateFunction，避免重复编译。

#### Scenario: 同一 Schema 多次使用

- **WHEN** 多个请求使用相同的 Schema 对象调用 `useBody(schema)`
- **THEN** Ajv `compile()` SHALL 只在首次调用时执行
- **AND** 后续调用 SHALL 复用缓存的 ValidateFunction

### Requirement: 扁平化 Schema 定义 (Flattened Schema Definition)

`@ravenjs/jtd-validator` SHALL 提供 `J.object()` API 用于定义对象 schema，无需显式写 `properties` / `optionalProperties` 嵌套结构。

#### Scenario: 定义包含必填和可选字段的对象

- **WHEN** 调用 `J.object({ name: J.string(), avatar: J.string().optional() })`
- **THEN** 生成的 JTD schema SHALL 为 `{ properties: { name: { type: "string" } }, optionalProperties: { avatar: { type: "string" } } }`

### Requirement: Optional 字段标记 (Optional Field Marker)

所有基础类型方法（`J.string()`, `J.int()` 等）SHALL 返回支持 `.optional()` 链式调用的对象。

#### Scenario: 标记字符串字段为可选

- **WHEN** 调用 `J.string().optional()`
- **THEN** 返回的 schema 对象 SHALL 被标记为 optional
- **AND** 在 `J.object()` 中使用时 SHALL 被放入 `optionalProperties`

### Requirement: Nullable 值支持 (Nullable Value Support)

所有基础类型方法 SHALL 返回支持 `.nullable()` 链式调用的对象，生成带 `nullable: true` 的 JTD schema。

#### Scenario: 标记字符串字段值可为 null

- **WHEN** 调用 `J.string().nullable()`
- **THEN** 生成的 JTD schema SHALL 为 `{ type: "string", nullable: true }`

### Requirement: 类型推断支持 (Type Inference Support)

`Infer<T>` 类型工具 SHALL 正确推断 optional 和 nullable 组合的 TypeScript 类型。

#### Scenario: 推断必填非空字段

- **WHEN** 定义 `const schema = J.object({ name: J.string() })`
- **THEN** `Infer<typeof schema>` SHALL 等于 `{ name: string }`

#### Scenario: 推断可选可空字段

- **WHEN** 定义 `const schema = J.object({ name: J.string().optional().nullable() })`
- **THEN** `Infer<typeof schema>` SHALL 等于 `{ name?: string | null }`

### Requirement: Schema 库无关性 (Schema Library Agnostic)

Core 层 SHALL 完全不依赖任何 Schema 验证库。`@ravenjs/jtd-validator` 使用 Ajv JTD，但用户可选择其他验证包（如未来的 `@ravenjs/zod-validator`）。

#### Scenario: Core 无 Ajv 依赖

- **WHEN** 检查 `@ravenjs/core` 的 package.json
- **THEN** SHALL 不包含 `ajv` 依赖

#### Scenario: 使用原始 State 访问

- **WHEN** 用户不安装任何验证包，直接使用 `BodyState.get()`
- **THEN** SHALL 返回 `unknown` 类型的原始数据，无验证
