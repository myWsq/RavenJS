## Context

**Background:**
The project had an inconsistent test directory structure:

- `modules/core/tests/` and `modules/core/__tests__/` - mixed unit/integration tests
- `modules/jtd-validator/tests/` - module tests
- `packages/cli/tests/` - E2E tests
- `packages/testing/tests/` - testing package tests

This structure made it difficult to:

- Run specific test categories (unit vs integration vs E2E)
- Understand test scope at a glance
- Follow industry best practices

**Current State:**

- Tests exist in multiple locations
- No clear separation between test types
- Import paths vary (some use `@ravenjs/testing`, some use relative paths)

## Goals / Non-Goals

**Goals:**

- Centralize all tests in `tests/` directory at project root
- Establish clear test type分层: unit, integration, e2e
- Update test scripts for easy test category execution
- Maintain Bun and Node.js (Vitest) compatibility

**Non-Goals:**

- Modify test assertions or test logic
- Add new tests (only restructuring existing ones)
- Change the testing framework (continue using `@ravenjs/testing` + Vitest)

## Decisions

### 1. Centralized Test Directory Structure

**Decision:** Move all tests to `tests/` root directory with subdirectories for each type.

**Rationale:**

- Follows industry best practices (Vite, Next.js, React patterns)
- Makes test types immediately obvious
- Simplifies test runner configuration

**Alternative Considered:**

- Keep tests alongside source code in `__tests__/` - rejected because it mixes test code with source code, making the project harder to navigate

### 2. Test Type Separation

**Decision:** Three-tier structure:

- `tests/unit/` - Unit tests (test single modules in isolation)
- `tests/integration/` - Integration tests (test cross-module interactions)
- `tests/e2e/` - E2E tests (test complete user workflows)

**Rationale:**

- Clear distinction allows selective test execution
- Unit tests run fast, E2E tests run slow - separation enables optimization

### 3. Import Path Strategy

**Decision:** Use relative paths (`../../modules/core/main`) from test files.

**Rationale:**

- More explicit than workspace package imports
- Works consistently across Bun and Node.js
- Avoids workspace linking issues

### 4. Test Scripts

**Decision:** Add granular test scripts:

- `test` - all tests
- `test:unit` - unit only
- `test:integration` - integration only
- `test:e2e` - E2E only

**Rationale:**

- Enables fast iteration (run only what you need)
- Common pattern in modern JS projects

## Risks / Trade-offs

**Risk:** Import path errors during migration

- **Mitigation:** Already verified all tests pass with new paths

**Risk:** IDE may show type errors initially

- **Mitigation:** Type errors are false positives; tests run correctly with Bun

**Trade-off:** Tests no longer colocated with source code

- This is acceptable as the benefits of centralized structure outweigh the loss of proximity
