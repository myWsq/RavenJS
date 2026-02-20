## 1. Setup Benchmark Infrastructure

- [x] 1.1 Create `benchmark/` directory structure with `micro/`, `e2e/`, and `compare/` subdirectories
- [x] 1.2 Add benchmark scripts to root `package.json`: `benchmark`, `benchmark:micro`, `benchmark:e2e`, `benchmark:compare`

## 2. Micro Benchmarks - Router

- [x] 2.1 Create `benchmark/micro/router.bench.ts` with RadixRouter import
- [x] 2.2 Implement static route matching benchmark (100/1000/10000 routes)
- [x] 2.3 Implement dynamic route (`:param`) matching benchmark
- [x] 2.4 Implement wildcard route (`*`) matching benchmark

## 3. Micro Benchmarks - Validator

- [x] 3.1 Create `benchmark/micro/validator.bench.ts` with AJV/JTD imports
- [x] 3.2 Implement simple schema validation benchmark (3-5 fields)
- [x] 3.3 Implement complex schema validation benchmark (nested objects, arrays)
- [x] 3.4 Implement JTD parser vs JSON.parse comparison benchmark

## 4. Micro Benchmarks - State

- [x] 4.1 Create `benchmark/micro/state.bench.ts` with AppState/RequestState imports
- [x] 4.2 Implement state get/set operations benchmark
- [x] 4.3 Implement state inheritance chain lookup benchmark (varying depths)

## 5. E2E Benchmarks - Throughput

- [x] 5.1 Create `benchmark/e2e/throughput.bench.ts` with Raven app setup
- [x] 5.2 Implement simple GET request throughput benchmark
- [x] 5.3 Implement POST with JSON body throughput benchmark
- [x] 5.4 Implement request with hooks (onRequest/beforeHandle/beforeResponse) throughput benchmark

## 6. Framework Comparison (Optional)

- [x] 6.1 Create `benchmark/compare/frameworks.bench.ts` with conditional imports
- [x] 6.2 Implement Hono comparison test with graceful skip if not installed
- [x] 6.3 Implement Elysia comparison test with graceful skip if not installed
- [x] 6.4 Add instructions in README for installing comparison dependencies

## 7. Documentation & Verification

- [x] 7.1 Create `benchmark/README.md` with usage instructions and result interpretation guide
- [x] 7.2 Run all benchmarks to verify functionality
- [x] 7.3 Document baseline performance numbers for reference
