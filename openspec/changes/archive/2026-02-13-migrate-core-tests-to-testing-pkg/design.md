## Context

目前 `packages/core` 的测试主要依赖于直接从 `vitest` 导入。

## Goals / Non-Goals

**Goals:**

- 将所有测试导入点统一为 `@ravenjs/testing`。

## Decisions

### 1. 批量替换

由于测试 API 是兼容的，大部分工作是字符串替换。

## Risks / Trade-offs

- **[Risk] 遗漏特定 API** → 某些测试可能使用了目前 `@ravenjs/testing` 尚未导出的 API。
  - **Mitigation**: 如果发现缺失，及时更新 `@ravenjs/testing`。
