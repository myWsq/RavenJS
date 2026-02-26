# RavenJS Benchmarks

Performance benchmarks for RavenJS framework components.

## Prerequisites

- Bun runtime (latest version recommended)
- mitata benchmark library (auto-installed)

```bash
bun add -d mitata
```

## Running Benchmarks

### All Benchmarks (Micro + E2E)

```bash
bun run benchmark
```

### Micro Benchmarks Only

Tests individual components in isolation:

```bash
bun run benchmark:micro
```

Includes:

- **Router** - RadixRouter matching performance
- **Validator** - JTD Schema validation performance
- **State** - AppState/RequestState operations

### E2E Benchmarks Only

Tests complete request handling:

```bash
bun run benchmark:e2e
```

Includes:

- Simple GET/POST requests
- JSON body parsing and validation
- Hook chain execution
- Routing overhead

### Framework Comparison (Optional)

Compare RavenJS with other frameworks:

```bash
bun run benchmark:compare
```

**Note:** Requires additional dependencies:

```bash
# Install comparison frameworks (optional)
bun add hono elysia
```

The benchmark gracefully skips frameworks that aren't installed.

## Benchmark Files

```
benchmark/
├── micro/
│   ├── router.bench.ts     # RadixRouter performance
│   ├── validator.bench.ts  # AJV/JTD validation
│   └── state.bench.ts      # AsyncLocalStorage state
├── e2e/
│   └── throughput.bench.ts # HTTP request handling
├── compare/
│   └── frameworks.bench.ts # Multi-framework comparison
└── README.md
```

## Interpreting Results

Results are displayed in ops/sec (operations per second):

```
benchmark              avg (min ... max)     p75 / p99
--------------------------------------------------
router 100 routes      2.5M ops/sec          ...
router 1000 routes     2.3M ops/sec          ...
```

### Key Metrics

| Metric      | Description                   |
| ----------- | ----------------------------- |
| **avg**     | Average operations per second |
| **p75**     | 75th percentile latency       |
| **p99**     | 99th percentile latency       |
| **min/max** | Range of measurements         |

### What to Look For

1. **Router scaling** - Performance should remain stable as route count increases
2. **Validation overhead** - JTD parser should be faster than JSON.parse + validate
3. **State lookup** - Inheritance chain depth should have minimal impact
4. **Hook overhead** - Each hook should add minimal latency

## Running Individual Benchmarks

```bash
# Run a specific benchmark file
bun run benchmark/micro/router.bench.ts

# Run with different options
bun run benchmark/micro/router.bench.ts --json  # JSON output
```

## Environment Considerations

For consistent results:

1. Close other applications
2. Run multiple times and compare
3. Use the same machine for comparisons
4. Note Bun version in reports

## Baseline Performance

Baseline numbers (Apple Silicon, Bun 1.3.10):

### Micro Benchmarks

| Test                                  | Performance                    | Notes                      |
| ------------------------------------- | ------------------------------ | -------------------------- |
| Static route match (100-10000 routes) | ~70-85 ns/iter (~13M ops/sec)  | Stable across route counts |
| Dynamic route match (:param)          | ~108-111 ns/iter (~9M ops/sec) | Includes param extraction  |
| Wildcard route match (\*)             | ~62-89 ns/iter (~14M ops/sec)  | Fast wildcard handling     |
| Simple schema validation              | ~11 ns/iter (~90M ops/sec)     | 3-field object             |
| Complex schema validation             | ~1.12 µs/iter (~890K ops/sec)  | Nested objects + arrays    |
| State get/set                         | ~42-46 ns/iter (~22M ops/sec)  | AsyncLocalStorage overhead |
| State inheritance (depth 10)          | ~105 ns/iter (~9.5M ops/sec)   | Parent chain lookup        |

### E2E Request Handling

| Test                      | Performance                  | Notes            |
| ------------------------- | ---------------------------- | ---------------- |
| Simple GET (text)         | ~2.6 µs/iter (~385K req/sec) | Minimal handler  |
| GET with JSON response    | ~2.8 µs/iter (~357K req/sec) | Response.json()  |
| POST with body validation | ~4.7 µs/iter (~213K req/sec) | JTD body parsing |
| GET with 3 hooks          | ~2.8 µs/iter (~357K req/sec) | Full hook chain  |
| Dynamic route params      | ~3.1 µs/iter (~323K req/sec) | 2 path params    |

_Actual numbers will vary based on hardware and Bun version._
