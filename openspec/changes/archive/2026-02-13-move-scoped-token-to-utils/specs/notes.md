## Context

这是一个重构任务，不涉及功能变更或需求变更。现有的 scoped-token 规范已存在于 `openspec/specs/scoped-token/spec.md`。

本次变更仅是代码位置调整：
- 从 `packages/main/index.ts` 迁移到 `packages/main/utils/scoped-token.ts`
- 不改变任何 API 或行为
- 不增加或修改任何需求

因此无需创建新的规格文件。
