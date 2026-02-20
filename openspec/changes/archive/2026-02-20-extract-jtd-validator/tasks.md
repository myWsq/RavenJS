## 1. Create @ravenjs/jtd-validator Package Structure

- [x] 1.1 Create `packages/jtd-validator/` directory
- [x] 1.2 Create `packages/jtd-validator/package.json` with name `@ravenjs/jtd-validator`, ajv dependency, and peer dependency on `@ravenjs/core`
- [x] 1.3 Create `packages/jtd-validator/main.ts` with basic structure

## 2. Move JTD Schema DSL to New Package

- [x] 2.1 Move `OPTIONAL` symbol and related types from core to jtd-validator
- [x] 2.2 Move `JTDType`, `JTDBaseSchema`, `JTDSchema` types
- [x] 2.3 Move `FieldSchema` interface and `createField()` function
- [x] 2.4 Move `J` object with all schema builder methods (string, int, object, array, etc.)
- [x] 2.5 Move all `Infer` related types (`InferSchema`, `InferFieldSchema`, `InferNullable`, etc.)

## 3. Implement Lazy Validation Hooks

- [x] 3.1 Import Ajv and create singleton instance
- [x] 3.2 Implement `validatorCache` using WeakMap for compiled validators
- [x] 3.3 Implement `getOrCompileValidator()` helper function
- [x] 3.4 Implement `useBody<T>(schema: T): Infer<T>` with validation logic
- [x] 3.5 Implement `useQuery<T>(schema: T): Infer<T>`
- [x] 3.6 Implement `useParams<T>(schema: T): Infer<T>`
- [x] 3.7 Implement `useHeaders<T>(schema: T): Infer<T>`

## 4. Setup Package Exports

- [x] 4.1 Create `packages/jtd-validator/index.ts` with public API exports
- [x] 4.2 Export schema DSL: `J`, `OPTIONAL`, `FieldSchema`, `JTDSchema`, `Infer`
- [x] 4.3 Export validation hooks: `useBody`, `useQuery`, `useParams`, `useHeaders`

## 5. Remove JTD/Validation from Core

- [x] 5.1 Remove `import Ajv` and related imports
- [x] 5.2 Remove `OPTIONAL` symbol and all JTD type definitions
- [x] 5.3 Remove `createField()` function and `J` object
- [x] 5.4 Remove all `Infer` related types
- [x] 5.5 Remove `HandlerBuilder` class and `createHandler()` function
- [x] 5.6 Simplify `Handler` type to plain function type
- [x] 5.7 Remove `bodySchema`, `bodyValidator` etc. properties from Handler
- [x] 5.8 Remove `runValidator()` method
- [x] 5.9 Remove validation calls from `processStates()` (keep only JSON parse and State.set)
- [x] 5.10 Remove `useBody`, `useQuery`, `useParams`, `useHeaders` functions from core (keep raw State access)

## 6. Update Core Package Configuration

- [x] 6.1 Remove `ajv` from `packages/core/package.json` dependencies
- [x] 6.2 Update `packages/core/index.ts` exports (remove schema-related exports)

## 7. Update Tests

- [x] 7.1 Create `packages/jtd-validator/tests/validator.test.ts` with validation tests
- [x] 7.2 Update existing core tests to use new import paths where needed
- [x] 7.3 Add tests for lazy validation behavior (validation on useBody call)
- [x] 7.4 Add tests for validator caching

## 8. Update Benchmarks

- [x] 8.1 Update `benchmark/micro/validator.bench.ts` imports to use `@ravenjs/jtd-validator`
- [x] 8.2 Verify benchmarks still run correctly

## 9. Verification

- [x] 9.1 Run all tests: `bun test`
- [x] 9.2 Run benchmarks: `bun run benchmark`
- [x] 9.3 Verify core package size reduced (no ajv dependency)
