# Development Specification

> **Migration Note**: This spec consolidates following original specs:
>
> - `unified-test-interface`
> - `test-organization`
> - `cli-e2e-testing`
> - `performance-benchmark`
> - `single-file-organization`

## Purpose

定义 RavenJS 开发相关的所有工具和规范，包括测试接口、测试组织、性能测试、代码组织规范等。

## Requirements

### Requirement: Unified Test Primitives

测试代码必须使用 Bun 内置的 `bun:test` 提供的测试原语：`describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`, `mock`, `spyOn` 等。

#### Scenario: 导入测试原语

- **WHEN** 开发者从 `bun:test` 导入 `describe`、`it`、`expect` 等
- **THEN** 测试必须在 Bun 环境下正常执行

### Requirement: Type Safety

系统必须为所有导出的 API 提供完整的 TypeScript 类型支持，确保在 IDE 中有正确的补全和错误提示。

#### Scenario: 类型检查

- **WHEN** 使用 TypeScript 编写测试代码
- **THEN** `expect(foo).toBe(bar)` 等调用应当具有正确的类型推导

### Requirement: Centralized test directory structure

The project SHALL organize all tests in a centralized `tests/` directory at project root, with clear separation between test types.

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

#### Scenario: Import from bun:test

- **WHEN** a test file imports test utilities
- **THEN** it SHALL import from `bun:test` (e.g. `import { describe, it, expect } from "bun:test"`)

### Requirement: Bun Test Runner

The test structure SHALL use Bun's built-in test runner exclusively.

#### Scenario: Run tests with Bun

- **WHEN** developer runs `bun test tests/`
- **THEN** all test files SHALL execute successfully

### Requirement: 可配置的拉取来源覆盖

CLI SHALL 在默认使用 GitHub 拉取代码的同时，支持通过显式配置将拉取来源覆盖为本地路径。

#### Scenario: 使用本地路径替代 GitHub

- **WHEN** 测试运行时提供本地拉取配置
- **THEN** CLI 从本地路径拉取代码且不访问 GitHub

### Requirement: 端到端测试覆盖关键流程

测试系统 SHALL 提供覆盖初始化、拉取、构建、运行等关键路径的 CLI e2e 测试用例。

#### Scenario: 完整流程可在本地执行

- **WHEN** 运行 CLI e2e 测试
- **THEN** 测试依次验证初始化、拉取、构建、运行的成功结果

### Requirement: 测试夹具与环境隔离

e2e 测试 SHALL 使用固定夹具与临时目录进行隔离，确保可重复执行并可清理。

#### Scenario: 测试结束后环境可清理

- **WHEN** e2e 测试完成
- **THEN** 临时目录与生成产物被清理或可被统一回收

### Requirement: 生产默认行为保持不变

在未提供测试覆盖配置时，CLI SHALL 继续从 GitHub 拉取代码。

#### Scenario: 默认仍从 GitHub 拉取

- **WHEN** 未设置本地拉取配置
- **THEN** CLI 仍按现有逻辑从 GitHub 拉取代码

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
- **THEN** 系统运行 benchmark/micro/ 目录下所有 \*.bench.ts 文件

#### Scenario: Run e2e benchmarks

- **WHEN** 用户执行 `bun run benchmark:e2e`
- **THEN** 系统运行 benchmark/e2e/ 目录下所有 \*.bench.ts 文件

#### Scenario: Run all benchmarks

- **WHEN** 用户执行 `bun run benchmark`
- **THEN** 系统依次运行 micro 和 e2e 所有测试

### Requirement: Single File Core Structure

每个包的所有业务逻辑 SHALL 存放在单一的 `main.ts` 文件中。`index.ts` 作为包入口点，显式管理导出。

#### Scenario: Package file structure

- **WHEN** 检查 `packages/<package>/` 目录结构
- **THEN** 目录中仅包含 `main.ts`、`index.ts` 和 `tests/` 子目录

#### Scenario: No utils directory

- **WHEN** 需要添加工具函数或辅助代码
- **THEN** 将代码添加到 `main.ts` 的适当分区中，而非创建 `utils/` 目录

### Requirement: Code Section Organization

`main.ts` 中的代码 SHALL 按照依赖顺序组织为明确的分区（sections），使用统一格式的分区注释分隔。

#### Scenario: Section comment format

- **WHEN** 在 `main.ts` 中添加新的代码分区
- **THEN** 使用以下格式的分区注释：
  ```
  // =============================================================================
  // SECTION: Section Name
  // =============================================================================
  ```

#### Scenario: Section dependency order

- **WHEN** 组织 `main.ts` 中的代码
- **THEN** 分区按以下顺序排列（可根据包的实际需要增减）：
  1. Imports - 外部依赖
  2. Types & Interfaces - 类型定义
  3. Error Handling - 错误类
  4. State Management - 状态管理
  5. Validation - 验证器
  6. Router - 路由实现
  7. Server Adapters - 服务器适配器
  8. Core Framework - 核心框架类

### Requirement: No Forward References

代码组织 SHALL 确保每个分区只引用其上方分区定义的内容，避免前向引用。

#### Scenario: Dependency direction

- **WHEN** 某分区的代码需要引用其他类型或函数
- **THEN** 被引用的内容 MUST 在当前分区之前的分区中定义

#### Scenario: Circular dependency prevention

- **WHEN** TypeScript 编译器分析 `main.ts`
- **THEN** 不存在任何循环依赖警告

### Requirement: Explicit Export Management

`index.ts` SHALL 显式管理所有导出，区分 Public API 和 Internal API。

#### Scenario: Public API exports

- **WHEN** 定义用户应该使用的 API
- **THEN** 在 `index.ts` 的 `// Public API` 分区中显式导出，包括：
  - 核心类和函数
  - 类型定义
  - 用户可能需要的辅助函数

#### Scenario: Internal API exports

- **WHEN** 定义框架内部或测试使用的 API
- **THEN** 在 `index.ts` 的 `// Internal API` 分区中显式导出，并添加注释说明不建议用户直接使用

#### Scenario: Index file structure

- **WHEN** 编写 `index.ts` 文件
- **THEN** 使用以下结构：

  ```typescript
  // =============================================================================
  // Public API - 用户应该使用的导出
  // =============================================================================
  export { ... } from "./main.ts";
  export type { ... } from "./main.ts";

  // =============================================================================
  // Internal API - 框架内部或测试使用，不建议用户直接使用
  // =============================================================================
  export { ... } from "./main.ts";
  export type { ... } from "./main.ts";
  ```

### Requirement: Public API Stability

代码重构 SHALL NOT 改变任何公开导出的 API 签名。

#### Scenario: Export compatibility

- **WHEN** 外部代码从包导入
- **THEN** 所有 Public API 的导入路径和类型签名保持不变

#### Scenario: Plugin compatibility

- **WHEN** 现有插件使用框架 API
- **THEN** 插件无需任何修改即可继续工作
