## ADDED Requirements

### Requirement: Router Benchmark

系统 SHALL 提供 RadixRouter 路由匹配性能测试，测量不同路由规模下的匹配速度。

#### Scenario: Benchmark static route matching

- **WHEN** 执行 `bun run benchmark:micro` 命令
- **THEN** 系统运行 router.bench.ts 并输出静态路由匹配的 ops/sec 指标

#### Scenario: Benchmark dynamic route matching

- **WHEN** router.bench.ts 执行动态路由（如 `/users/:id`）匹配测试
- **THEN** 系统输出包含参数提取的路由匹配 ops/sec 指标

#### Scenario: Benchmark route scaling

- **WHEN** 测试分别在 100、1000、10000 路由规模下运行
- **THEN** 系统输出各规模下的性能对比数据

### Requirement: Validator Benchmark

系统 SHALL 提供 JTD Schema 验证性能测试，测量不同复杂度 Schema 的验证速度。

#### Scenario: Benchmark simple schema validation

- **WHEN** validator.bench.ts 执行简单对象（3-5 字段）验证
- **THEN** 系统输出验证操作的 ops/sec 指标

#### Scenario: Benchmark complex schema validation

- **WHEN** validator.bench.ts 执行复杂对象（嵌套结构、数组）验证
- **THEN** 系统输出复杂验证的 ops/sec 指标

#### Scenario: Benchmark JTD parser performance

- **WHEN** validator.bench.ts 测试 compileParser 生成的解析器
- **THEN** 系统输出 JTD 解析器与标准 JSON.parse 的性能对比

### Requirement: State Benchmark

系统 SHALL 提供 AppState 和 RequestState 操作性能测试。

#### Scenario: Benchmark state get/set operations

- **WHEN** state.bench.ts 执行 State 读写操作测试
- **THEN** 系统输出 get/set 操作的 ops/sec 指标

#### Scenario: Benchmark state inheritance chain

- **WHEN** 测试多层 parent 链的状态查找
- **THEN** 系统输出不同继承深度下的查找性能

### Requirement: E2E Throughput Benchmark

系统 SHALL 提供端到端 HTTP 请求吞吐量测试，测量完整请求处理链路性能。

#### Scenario: Benchmark simple GET request

- **WHEN** 执行 `bun run benchmark:e2e` 命令
- **THEN** 系统启动测试服务器并输出简单 GET 请求的 RPS（Requests Per Second）

#### Scenario: Benchmark POST request with JSON body

- **WHEN** throughput.bench.ts 测试带 JSON body 的 POST 请求
- **THEN** 系统输出包含 body 解析和验证的请求处理 RPS

#### Scenario: Benchmark request with hooks

- **WHEN** 测试包含 onRequest、beforeHandle、beforeResponse 钩子的请求链路
- **THEN** 系统输出完整 hook 链路的请求处理 RPS

### Requirement: Framework Comparison Benchmark

系统 SHALL 提供与其他框架的性能对比测试（可选功能）。

#### Scenario: Compare with Hono

- **WHEN** 用户安装 hono 依赖并执行 `bun run benchmark:compare`
- **THEN** 系统输出 RavenJS 与 Hono 在相同场景下的性能对比

#### Scenario: Compare with Elysia

- **WHEN** 用户安装 elysia 依赖并执行对比测试
- **THEN** 系统输出 RavenJS 与 Elysia 在相同场景下的性能对比

#### Scenario: Graceful skip when dependencies missing

- **WHEN** 对比框架依赖未安装时执行对比测试
- **THEN** 系统跳过该框架测试并输出提示信息，不抛出错误

### Requirement: Benchmark CLI Integration

系统 SHALL 在 package.json 中提供便捷的 benchmark 脚本命令。

#### Scenario: Run all micro benchmarks

- **WHEN** 用户执行 `bun run benchmark:micro`
- **THEN** 系统运行 benchmark/micro/ 目录下所有 *.bench.ts 文件

#### Scenario: Run e2e benchmarks

- **WHEN** 用户执行 `bun run benchmark:e2e`
- **THEN** 系统运行 benchmark/e2e/ 目录下所有 *.bench.ts 文件

#### Scenario: Run all benchmarks

- **WHEN** 用户执行 `bun run benchmark`
- **THEN** 系统依次运行 micro 和 e2e 所有测试
