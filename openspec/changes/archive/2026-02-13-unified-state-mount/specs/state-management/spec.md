## ADDED Requirements

### Requirement: App-level State Management

The system SHALL provide an `AppState<T>` class for managing state at the application (Raven instance) level.

#### Scenario: AppState isolation

- **WHEN** a value is set for an `AppState` on one Raven instance
- **THEN** it SHALL NOT be accessible from a different Raven instance

#### Scenario: AppState inheritance

- **WHEN** a value is not set for an `AppState` on a child Raven instance (e.g., created via `.group()`)
- **THEN** it SHALL resolve to the value set on its parent Raven instance

### Requirement: Request-level State Management

The system SHALL provide a `RequestState<T>` class for managing state at the individual request level.

#### Scenario: RequestState isolation

- **WHEN** a value is set for a `RequestState` within one request's scope
- **THEN** it SHALL NOT be accessible from concurrent or subsequent requests

### Requirement: Unified State Access (get/set)

Both `AppState` and `RequestState` SHALL provide `get()` and `set(value)` methods that automatically identify the current active scope using asynchronous context.

#### Scenario: Context-aware set

- **WHEN** `AppState.set(value)` is called within a Raven instance's execution context (e.g., during plugin registration)
- **THEN** the value SHALL be associated with that specific instance

#### Scenario: Context-aware get

- **WHEN** `State.get()` is called within an active scope
- **THEN** it SHALL return the value associated with that scope without requiring an explicit instance or scope object

### Requirement: Safe State Access

The system SHALL provide a `getOrFailed()` method on all `ScopedState` subclasses to ensure required states are initialized.

#### Scenario: Uninitialized state access

- **WHEN** `getOrFailed()` is called and the state has not been set in any accessible scope
- **THEN** it SHALL throw a `RavenError` with a clear message
