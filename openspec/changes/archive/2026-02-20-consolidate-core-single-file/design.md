## Context

当前 `packages/core/` 目录结构：

- `main.ts` (485 行) - 核心框架逻辑
- `index.ts` (4 行) - 公开导出
- `utils/` 目录包含 5 个模块：
  - `error.ts` (80 行) - RavenError 类和错误工厂
  - `state.ts` (98 行) - 状态管理（AsyncLocalStorage）
  - `validator.ts` (33 行) - Ajv schema 验证
  - `router.ts` (88 行) - Radix 路由实现
  - `server-adapter.ts` (104 行) - Bun/Node 运行时适配器

总计约 888 行代码，分散在 7 个文件中。存在循环依赖问题：`state.ts` 依赖 `error.ts`，而 `main.ts` 依赖两者。

## Goals / Non-Goals

**Goals:**

- 将所有 core 代码整合到单一 `main.ts` 文件（约 800+ 行）
- 建立清晰的代码分区约定，确保单文件的可读性
- 消除模块间循环依赖问题
- 更新编码规范，明确单文件组织的最佳实践

**Non-Goals:**

- 不修改任何公开 API
- 不重构内部逻辑（仅移动代码）
- 不修改测试逻辑（仅更新 import 路径）

## Decisions

### 1. 代码分区顺序

采用依赖优先的分区顺序，避免前向引用：

```
1. Imports (外部依赖)
2. Types & Interfaces (类型定义)
3. Error Handling (错误类)
4. State Management (状态管理)
5. Validation (验证器)
6. Router (路由实现)
7. Server Adapters (服务器适配器)
8. Core Framework (Raven 主类)
9. Exports (需要时)
```

**理由**: 这个顺序确保每个分区只依赖其上方的分区，消除循环依赖。

### 2. 分区注释格式

使用统一的分区注释格式：

```typescript
// =============================================================================
// SECTION: Section Name
// =============================================================================
```

**理由**: 醒目的分隔线便于快速定位代码区域，且与常见开源项目风格一致。

### 3. index.ts 简化

`index.ts` 仅保留单行重导出：

```typescript
export * from "./main.ts";
```

**理由**: 所有公开 API 都在 `main.ts` 中定义并导出，`index.ts` 仅作为包入口点。

### 4. 测试文件更新策略

测试文件中的 import 路径从：

```typescript
import { xxx } from "../utils/state.ts";
```

更新为：

```typescript
import { xxx } from "../main.ts";
```

**理由**: 保持测试与实现的一致性，同时减少测试对内部结构的依赖。

## Risks / Trade-offs

**[单文件过长] → 通过清晰的分区注释和一致的组织结构缓解**
约 800 行的单文件在现代编辑器中完全可管理，且分区注释提供快速导航。

**[Git diff 可读性下降] → 接受此 trade-off**
代码移动会产生较大的初始 diff，但长期来看减少了跨文件修改的复杂性。

**[测试 import 更新] → 一次性批量更新**
所有测试文件需要更新 import 路径，但这是一次性的工作。
