## REMOVED Requirements

### Requirement: 路由组

**Reason**: 移除 group 机制以保持无嵌套的简单设计。路由分组与前缀累加不再由框架提供。

**Migration**: 用户自行在路径中拼接前缀，例如 `app.get('/api/v1/users', handler)` 替代 `app.group('/api', api => api.group('/v1', v1 => v1.get('/users', handler)))`。

#### Scenario: 路由前缀累加（已移除）

- **WHEN** 原先在 `raven.group('/api', ...)` 中定义 `api.get('/v1', ...)`
- **THEN** 该能力已移除，应改为直接注册 `raven.get('/api/v1', ...)`

## MODIFIED Requirements

### Requirement: App-level State Management

The system SHALL provide an `AppState<T>` class for managing state at the application (Raven instance) level.

#### Scenario: AppState isolation

- **WHEN** a value is set for an `AppState` on one Raven instance
- **THEN** it SHALL NOT be accessible from a different Raven instance

#### Scenario: AppState scoped to current instance only

- **WHEN** `AppState.get()` is called within a Raven instance's execution context
- **THEN** it SHALL return only the value set on that specific instance
- **AND** it SHALL NOT resolve to any parent instance (parent chain is removed)
