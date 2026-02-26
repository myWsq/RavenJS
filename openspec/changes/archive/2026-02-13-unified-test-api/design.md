## Context

RavenJS 作为一个单代码库（Monorepo），目前在开发过程中同时使用 Bun 和 Node.js。测试方面，Bun 提供了原生的 `bun:test`，而 Node.js 环境则使用 Vitest。由于这两个框架的 API 虽相似但导入路径和全局变量行为不同，开发者需要编写环境判断代码或在不同环境下重复导入，这增加了维护成本。

## Goals / Non-Goals

**Goals:**

- 提供一个统一的包 `@ravenjs/testing` (位于 `packages/testing`)。
- 导出通用的测试原语：`describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`。
- 实现环境自适应：
  - 在 Bun 运行时，自动桥接到 `bun:test`。
  - 在 Node.js/Vitest 运行时，自动桥接到 `vitest`。
- 提供完整的类型定义支持。

**Non-Goals:**

- 不打算实现一个新的测试框架，只是做一个轻量级的 API 桥接层。
- 不处理复杂的框架特有功能（如 Vitest 的 `vi.mock` 与 Bun 的 `mock` 差异，除非有通用抽象需求）。

## Decisions

### 1. 包结构与命名

- **路径**: `packages/testing`
- **名称**: `@ravenjs/testing`
- **入口**: `index.ts`

### 2. 环境检测逻辑

我们将使用简单的运行时检测：

```typescript
const isBun = typeof Bun !== "undefined";
```

或者检测环境变量：

```typescript
const isVitest = typeof process !== "undefined" && process.env.VITEST;
```

### 3. API 导出策略

为了保证类型友好，我们将定义一个通用的接口，并根据环境动态赋值导出。

### 4. 依赖管理

- 将 `vitest` 作为 `peerDependency`（或在根目录管理）。
- `bun-types` 用于类型支持。

## Risks / Trade-offs

- **[Risk] Matchers 差异** → `expect` 的扩展 matchers 在两个框架中可能不完全一致。
  - **Mitigation**: 初期仅导出最基础、通用的 matchers，对于差异较大的部分通过文档说明或在需要时增加 shim。
- **[Risk] 全局变量冲突** → 某些框架会自动注入全局变量。
  - **Mitigation**: 显式导出 API，鼓励用户使用命名导入而非依赖全局变量。
