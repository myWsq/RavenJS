# scoped-token Specification

## Purpose
该规范定义了 Raven 框架的异步作用域令牌机制（Scoped Token），允许在异步调用链中通过静态令牌共享和隔离数据。

## Requirements

### Requirement: Scoped Token Creation
The system SHALL provide a `createScopedToken<T>(name: string)` function to create unique, type-safe tokens for scoped variables.

#### Scenario: Independent tokens
- **WHEN** two tokens are created with the same or different names
- **THEN** setting a value for one token SHALL NOT affect the value of the other

### Requirement: Static Token Declaration
Developers SHALL declare `ScopedToken`s as global constants (typically at the module level) to ensure consistent identity across asynchronous boundaries.

#### Scenario: Identity consistency
- **WHEN** a token is declared once globally and used across different hooks/handlers
- **THEN** it SHALL resolve to the same underlying data within the same scope

### Requirement: Built-in Token Naming Convention
Raven framework's built-in tokens SHALL use the `raven:` prefix for their names.

#### Scenario: Built-in tokens
- **WHEN** a built-in token like RavenContext is created
- **THEN** its name SHALL follow the pattern `raven:<feature>` (e.g., `raven:context`)
