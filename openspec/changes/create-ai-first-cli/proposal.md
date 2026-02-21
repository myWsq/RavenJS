## Why

当前 AI Agent 在使用 RavenJS 时面临挑战：Agent 需要理解 npm 包的导出结构、阅读源码才能正确使用框架。通过将 RavenJS 打造成 AI First 框架，让 Agent 可以直接读取 SPEC.md 和源代码，降低使用门槛，提升开发效率。

## What Changes

- 创建 `raven` CLI 工具，支持 `init`、`add`、`update` 命令
- 为 core 包生成 AI 友好的 SPEC.md，包含 Overview、Quick Start、API Reference、Examples、Design Intent、Caveats
- 创建 SKILL.md，帮助 AI Agent 理解 CLI 使用方式和框架能力

## Capabilities

### New Capabilities

- `cli-tool`: RavenJS CLI 工具，提供 init、add、update 命令
- `ai-friendly-spec`: AI 友好的规格文档格式，帮助 Agent 理解框架

### Modified Capabilities

(无)

## Impact

- 新增 `packages/cli` 目录
- 修改 `packages/core` 添加 AI 友好的 SPEC.md
- 修改项目根目录结构支持 CLI 发布
