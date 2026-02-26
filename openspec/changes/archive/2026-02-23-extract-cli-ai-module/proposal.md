## Why

CLI 的 skills 和 commands 目前内嵌在 `packages/cli` 中，与 registry 的 `modules` 混在一起。将 AI 资源作为独立模块提取到 `packages/ai`，并在 registry 中作为顶级 `ai` 属性与 `modules` 并列，可以清晰区分框架模块（raven/）与 AI 资源（.claude/），便于独立维护、版本和发布。

## What Changes

- 新建 `packages/ai`：包含 skills 和 commands，作为独立 package
- 将 `packages/cli/templates/skills/` 和 `packages/cli/templates/commands/` 迁移到 `packages/ai/`
- Registry 增加顶级 `ai` 属性，与 `modules` 并列，描述 AI 资源文件与 fileMapping
- 从 `modules` 中移除 `ai-skills` 条目
- 更新 `generate-registry.ts` 以生成 `ai` 字段
- 更新 CLI 从 `registry.ai` 读取并安装 AI 资源，不再使用 `registry.modules["ai-skills"]`

## Capabilities

### New Capabilities

- `ai-package`: packages/ai 作为独立 package 存放 skills 和 commands
- `registry-ai-schema`: Registry 增加顶级 `ai` 属性，与 `modules` 并列

### Modified Capabilities

- `ai-first-integration`: AI 资源来自 packages/ai，registry 通过 `ai` 顶级属性描述

## Impact

- 新增 `packages/ai/` 目录及 package.json
- `packages/cli/templates/` 迁移至 `packages/ai/`，cli 不再包含 templates
- `packages/cli/registry.json` 与 `generate-registry.ts` 结构变更
- `packages/cli/index.ts`：改为消费 `registry.ai`，移除对 `ai-skills` 的特殊分支
- workspace 配置：`package.json` workspaces 需包含 `packages/ai`
