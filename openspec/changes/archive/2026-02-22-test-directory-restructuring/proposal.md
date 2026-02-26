## Why

The current test directory structure is inconsistent and doesn't follow industry best practices. Tests are scattered across `modules/*/tests/` and `packages/*/tests/` directories without clear separation between unit, integration, and E2E tests. This makes it difficult to:

- Quickly identify test types
- Run specific test categories
- Onboard new developers to the testing conventions

## What Changes

- **Move all tests to centralized `tests/` directory** at project root:
  - `tests/unit/` - Unit tests (previously in `modules/*/__tests__/`)
  - `tests/integration/` - Integration tests (previously cross-module tests)
  - `tests/e2e/` - End-to-end tests (previously in `packages/cli/tests/`)
- **Update test scripts** in `package.json` to reflect new structure:
  - `test` - Runs all tests
  - `test:unit` - Runs unit tests only
  - `test:integration` - Runs integration tests only
  - `test:e2e` - Runs E2E tests only
- **Fix import paths** in test files to use relative paths from new locations
- **Delete old test directories** (`modules/core/__tests__/`, `modules/jtd-validator/tests/`, `packages/*/tests/`)

## Capabilities

### New Capabilities

- `test-organization`: Centralized test directory structure with clear分层 (unit/integration/e2e)

### Modified Capabilities

- None - this is a refactoring change that doesn't modify existing requirements

## Impact

- Test file locations changed (but functionality unchanged)
- Updated test runner scripts in `package.json`
- Compatible with both Bun and Node.js (Vitest)
