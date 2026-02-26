## MODIFIED Requirements

### Requirement: Scoped State Creation

The system SHALL provide `AppState<T>` and `RequestState<T>` classes to create unique, type-safe state identifiers. This replaces the legacy `createScopedToken` function.

#### Scenario: Independent states

- **WHEN** two state identifiers are created with the same or different names
- **THEN** setting a value for one SHALL NOT affect the value of the other

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
