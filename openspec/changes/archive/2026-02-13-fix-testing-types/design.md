## Context

当前的 `index.ts` 动态导入了测试框架，但由于缺乏显式类型声明，导致导出的 `describe`, `it` 等 API 在 IDE 中被推断为 `any`。

## Goals / Non-Goals

**Goals:**

- 提供准确的类型提示。
- 保持运行时环境检测和动态导入。

## Decisions

### 1. 使用 `import type`

我们将使用 `import type` 导入 `vitest` 和 `bun:test` 的类型。

### 2. 导出显式命名的类型

手动声明导出变量的类型。

## Risks / Trade-offs

- **[Risk] 类型冲突** → `vitest` 和 `bun:test` 的某些深层类型可能微有不同。
  - **Mitigation**: 使用它们的公共交集或 `any` 作为兜底，但确保核心 API（如 `it(name, fn)`) 是准确的。
