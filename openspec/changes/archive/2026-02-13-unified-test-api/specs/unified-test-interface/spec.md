## ADDED Requirements

### Requirement: Unified Test Primitives

该系统必须导出以下测试原语，以便在测试代码中使用：`describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`。

#### Scenario: 导入测试原语

- **WHEN** 开发者从 `@ravenjs/testing` 导入 `describe` 和 `it`
- **THEN** 导出的函数必须在当前运行环境下有效并能正常执行测试任务

### Requirement: Runtime Adaptation

系统必须能够自动检测当前的运行时环境（Bun 或 Node.js/Vitest），并动态切换到底层实现。

#### Scenario: Bun 环境运行

- **WHEN** 测试在 Bun 环境下执行
- **THEN** 系统必须使用 `bun:test` 提供的实现

#### Scenario: Vitest 环境运行

- **WHEN** 测试在 Node.js 环境下由 Vitest 启动
- **THEN** 系统必须使用 `vitest` 提供的实现

### Requirement: Type Safety

系统必须为所有导出的 API 提供完整的 TypeScript 类型支持，确保在 IDE 中有正确的补全和错误提示。

#### Scenario: 类型检查

- **WHEN** 使用 TypeScript 编写测试代码
- **THEN** `expect(foo).toBe(bar)` 等调用应当具有正确的类型推导
