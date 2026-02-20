## MODIFIED Requirements

### Requirement: Scoped State Creation
The system SHALL provide `AppState<T>` and `RequestState<T>` classes to create unique, type-safe state identifiers. 工厂函数采用对象参数风格，`name` 为可选属性。创建时可选地指定标准 JSON Schema 对象和数据源（Body/Query/Params/Header），使该状态具备作为 State Slot 的能力。

#### Scenario: Independent states
- **WHEN** two state identifiers are created with the same or different names
- **THEN** setting a value for one SHALL NOT affect the value of the other

#### Scenario: 创建带 Schema 的状态（对象参数）
- **WHEN** 调用 `createRequestState({ schema: { type: 'object', ... }, source: 'body' })`
- **THEN** 返回的 `RequestState` 实例应当携带 `schema` 和 `source` 元数据
- **AND** 该状态可以作为 Handler 的 Slot 使用

#### Scenario: 不提供 name 时自动生成
- **WHEN** 调用 `createRequestState({ source: 'body' })` 不传入 `name`
- **THEN** 返回的 `RequestState` 实例应当具有唯一的内部标识符
- **AND** 该状态依然可以正常使用

#### Scenario: 仅提供 name（保持原有简洁用法）
- **WHEN** 调用 `createRequestState({ name: 'myState' })` 只传入 `name`
- **THEN** 返回的 `RequestState` 实例的 `schema` 和 `source` 应当为 undefined
- **AND** 该状态的行为与之前完全一致

#### Scenario: 无参数调用
- **WHEN** 调用 `createRequestState()` 不传入任何参数
- **THEN** 返回的 `RequestState` 实例应当具有唯一的内部标识符
- **AND** 该状态可以正常用于存取数据
