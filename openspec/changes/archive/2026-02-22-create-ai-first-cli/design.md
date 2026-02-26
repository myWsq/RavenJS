## Context

当前 AI Agent 在使用 RavenJS 时面临挑战：需要理解 npm 包结构、阅读源码才能正确使用框架。用户希望通过 CLI 工具 + 代码复制的方式，让 Agent 可以直接读取 SPEC.md 和源代码，降低使用门槛。

## Goals / Non-Goals

**Goals:**

- 创建 `raven` CLI 工具，支持 `init`、`add <feature>`、`update` 命令
- 生成 AI 友好的 SPEC.md，帮助 Agent 理解框架能力
- 创建 SKILL.md，让 Trae/Cursor Agent 知道如何使用 CLI

**Non-Goals:**

- 不修改现有 RavenJS 核心代码结构
- 不处理复杂的 AI merge 冲突（提示用户手动处理）
- 不支持私有部署或自定义 registry

## Decisions

### 1. CLI 架构

选择单文件 CLI，所有逻辑在一个 .ts 文件中，简单易于维护。

### 2. 代码复制策略

直接复制 packages 目录到用户工作区，保持源码可读性。

### 3. SPEC.md 生成策略

静态文件方式，预先写好保存在仓库中。

### 4. SKILL.md 位置

复制到用户工作区的 `.trae/skills/ravenjs/SKILL.md`。

## Risks / Trade-offs

| 风险     | 描述                       | 缓解措施          |
| -------- | -------------------------- | ----------------- |
| 代码冲突 | 用户修改源码后 update 冲突 | 提示用户先 commit |
| 版本同步 | 复制的代码与原版不同步     | 提供 update 命令  |

## Migration Plan

1. 创建 `packages/cli` 目录
2. 实现 `init`、`add`、`update` 命令
3. 在 `packages/core` 中添加 AI 友好的 SPEC.md
4. 创建 SKILL.md 模板
5. 发布 CLI 到 npm（可选）
