## ADDED Requirements

### Requirement: Centralized test directory structure

The project SHALL organize all tests in a centralized `tests/` directory at the project root, with clear separation between test types.

#### Scenario: Unit tests location

- **WHEN** a developer writes unit tests for a module
- **THEN** tests SHALL be placed in `tests/unit/<module>/` directory

#### Scenario: Integration tests location

- **WHEN** a developer writes integration tests that cross module boundaries
- **THEN** tests SHALL be placed in `tests/integration/` directory

#### Scenario: E2E tests location

- **WHEN** a developer writes end-to-end tests for complete workflows
- **THEN** tests SHALL be placed in `tests/e2e/` directory

### Requirement: Test execution scripts

The project SHALL provide granular test scripts in `package.json` for running specific test categories.

#### Scenario: Run all tests

- **WHEN** developer runs `bun test` or `npm test`
- **THEN** all tests (unit, integration, E2E) SHALL execute

#### Scenario: Run unit tests only

- **WHEN** developer runs `bun run test:unit`
- **THEN** only tests in `tests/unit/` SHALL execute

#### Scenario: Run integration tests only

- **WHEN** developer runs `bun run test:integration`
- **THEN** only tests in `tests/integration/` SHALL execute

#### Scenario: Run E2E tests only

- **WHEN** developer runs `bun run test:e2e`
- **THEN** only tests in `tests/e2e/` SHALL execute

### Requirement: Import paths

Tests SHALL use relative import paths to reference source modules from their new centralized location.

#### Scenario: Import from core module

- **WHEN** a test file in `tests/unit/core/` imports from `@ravenjs/core`
- **THEN** it SHALL use relative path `../../../modules/core/main`

#### Scenario: Import from testing package

- **WHEN** a test file imports test utilities
- **THEN** it SHALL use relative path to `@ravenjs/testing` package

### Requirement: Framework compatibility

The test structure SHALL remain compatible with both Bun's built-in test runner and Vitest.

#### Scenario: Run tests with Bun

- **WHEN** developer runs `bun test tests/`
- **THEN** all test files SHALL execute successfully

#### Scenario: Run tests with Vitest

- **WHEN** developer runs `vitest run tests/`
- **THEN** all test files SHALL execute successfully
