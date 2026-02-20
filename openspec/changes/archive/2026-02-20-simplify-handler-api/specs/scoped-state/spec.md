# scoped-state Specification

## Purpose
该规范定义了 Raven 框架的异步作用域状态机制，允许在异步调用链中共享和隔离数据。已由 Scoped Token 升级为 Scoped State 体系。

## Requirements

### Requirement: Scoped State Creation
The system SHALL provide `AppState<T>` and `RequestState<T>` classes to create unique, type-safe state identifiers. 工厂函数采用对象参数风格，`name` 为可选属性。创建时可选地指定标准 JSON Schema 对象，使该状态具备参与自动校验的能力。

#### Scenario: Independent states
- **WHEN** two state identifiers are created with the same or different names
- **THEN** setting a value for one SHALL NOT affect the value of the other

#### Scenario: 创建带 Schema 的状态（对象参数）
- **WHEN** 调用 `createRequestState({ schema: { type: 'object', ... } })`
- **THEN** 返回的 `RequestState` 实例应当携带 `schema` 元数据
- **AND** 该状态可以挂载到 Handler 的 `body/query/params/headers` 属性上

#### Scenario: 不提供 name 时自动生成
- **WHEN** 调用 `createRequestState({})` 或 `createRequestState()` 不传入 `name`
- **THEN** 返回的 `RequestState` 实例应当具有唯一的内部标识符
- **AND** 该状态依然可以正常使用

#### Scenario: 仅提供 name（保持原有简洁用法）
- **WHEN** 调用 `createRequestState({ name: 'myState' })` 只传入 `name`
- **THEN** 返回的 `RequestState` 实例的 `schema` 应当为 undefined
- **AND** 该状态的行为与之前完全一致

#### Scenario: 无参数调用
- **WHEN** 调用 `createRequestState()` 不传入任何参数
- **THEN** 返回的 `RequestState` 实例应当具有唯一的内部标识符
- **AND** 该状态可以正常用于存取数据

### Requirement: Static State Declaration
Developers SHALL declare `AppState` and `RequestState` instances as global constants (typically at the module level) to ensure consistent identity across asynchronous boundaries.

#### Scenario: Identity consistency
- **WHEN** a state identifier is declared once globally and used across different hooks/handlers
- **THEN** it SHALL resolve to the same underlying data within the same scope

### Requirement: Built-in State Naming Convention
Raven framework's built-in states SHALL use the `raven:` prefix for their names.

#### Scenario: Built-in states
- **WHEN** a built-in state like `RavenContext` is created
- **THEN** its name SHALL follow the pattern `raven:<feature>` (e.g., `raven:context`)
