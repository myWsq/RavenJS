## ADDED Requirements

### Requirement: Unified Scoped Execution
The system SHALL provide a `runScoped(callback)` function to execute a callback within a new asynchronous scope.

#### Scenario: Verify scope initialization
- **WHEN** `runScoped` is called
- **THEN** a new `Map` SHALL be initialized as the store for all `ScopedToken`s in that execution branch

### Requirement: Scoped Token Creation
The system SHALL provide a `createScopedToken<T>(name: string)` function to create unique, type-safe tokens for scoped variables.

#### Scenario: Independent tokens
- **WHEN** two tokens are created with the same or different names
- **THEN** setting a value for one token SHALL NOT affect the value of the other
