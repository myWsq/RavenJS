## 1. Setup

- [x] 1.1 Create `tests/` directory structure (unit/, integration/, e2e/)
- [x] 1.2 Update package.json test scripts

## 2. Unit Tests Migration

- [x] 2.1 Create `tests/unit/core/app.test.ts`
- [x] 2.2 Create `tests/unit/core/context.test.ts`
- [x] 2.3 Create `tests/unit/core/hooks.test.ts`
- [x] 2.4 Create `tests/unit/core/plugin.test.ts`
- [x] 2.5 Create `tests/unit/core/router.test.ts`
- [x] 2.6 Create `tests/unit/core/routing.test.ts`
- [x] 2.7 Create `tests/unit/core/state.test.ts`
- [x] 2.8 Fix import paths in unit tests

## 3. Integration Tests Migration

- [x] 3.1 Create `tests/integration/jtd-schema.test.ts`
- [x] 3.2 Create `tests/integration/jtd-validator.test.ts`
- [x] 3.3 Update `tests/integration/testing-api.test.ts`
- [x] 3.4 Fix import paths in integration tests

## 4. E2E Tests Migration

- [x] 4.1 Create `tests/e2e/cli.test.ts`
- [x] 4.2 Fix import paths in E2E tests

## 5. Cleanup

- [x] 5.1 Delete old test directories (`modules/core/__tests__/`)
- [x] 5.2 Verify all tests pass

## 6. Verification

- [x] 6.1 Run `bun test tests/unit/**/*.test.ts`
- [x] 6.2 Run `bun test tests/integration/*.test.ts`
- [x] 6.3 Run `bun test tests/e2e/*.test.ts`
