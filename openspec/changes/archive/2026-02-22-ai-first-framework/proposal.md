## Why

当前 RavenJS 缺乏 AI 优先的开发体验。用户无法通过自然语言与 Claude 等 AI 助手交互来安装和管理 RavenJS 项目。需要建立 AI 可识别的 skill 和 command 机制，让 AI 能够理解并调用 RavenJS 的命令行工具。

## What Changes

- 新增 `raven init` 命令：将 AI skills 和 commands 安装到 `.claude/` 目录
- 更新 `raven update` 命令：同时更新框架模块和 AI skills/commands
- 添加 AI skills 模板：`raven-install`、`raven-add`
- 添加 AI commands 模板：`raven/install.md`、`raven/add.md`

## Capabilities

### New Capabilities

- `ai-first-integration`: 提供 AI 可识别的 skill 和 command 机制，支持通过自然语言管理 RavenJS 项目
- `cli-ai-commands`: 扩展 Raven CLI 以支持 AI 工作流所需的新命令（init、install）

### Modified Capabilities

- `cli-update`: 更新 `raven update` 命令以支持同步 AI skills/commands

## Impact

- `packages/cli/index.ts`: 新增 `init`、`install` 命令，更新 `update` 命令
- `packages/cli/registry.json`: 添加 AI skills/commands 到注册表
- 新增 `packages/cli/templates/skills/` 和 `packages/cli/templates/commands/` 目录存放模板
- 用户项目新增 `.claude/` 目录（由 `raven init` 创建）
