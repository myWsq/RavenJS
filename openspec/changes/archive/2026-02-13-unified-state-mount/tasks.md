## 1. Core State Implementation

- [x] 1.1 Create `packages/core/utils/state.ts` with `ScopedState`, `AppState`, and `RequestState` classes
- [x] 1.2 Implement `AsyncLocalStorage` trackers for `currentAppStorage` and `requestStorage`
- [x] 1.3 Implement `AppState` lookup logic (self -> parent recursion)
- [x] 1.4 Implement `getOrFailed()` with proper error handling

## 2. Raven Framework Integration

- [x] 2.1 Add `internalStateMap` to the `Raven` class in `packages/core/main.ts`
- [x] 2.2 Wrap `register()` and `group()` calls in `currentAppStorage.run()`
- [x] 2.3 Update `handleRequest()` to wrap the entire lifecycle in both `currentAppStorage.run()` and `requestStorage.run()`
- [x] 2.4 Update `RavenContext` definition to use `RequestState`

## 3. Cleanup and Refactoring

- [x] 3.1 Update `packages/core/utils/error.ts` with new state-related error messages
- [x] 3.2 Remove legacy `packages/core/utils/scoped-token.ts`
- [x] 3.3 Fix any remaining imports of `scoped-token.ts` across the core package

## 4. Testing and Verification

- [x] 4.1 Update `packages/core/tests/scoped-token.test.ts` (rename to `state.test.ts`) to verify `AppState` and `RequestState` behaviors
- [x] 4.2 Add tests for `AppState` inheritance across nested Raven groups
- [x] 4.3 Verify `RavenContext` integration in `packages/core/tests/integration-router.test.ts`
- [x] 4.4 Run all core tests to ensure no regressions
