## Why

当前框架的安装流程需要用户先手动执行 `bun add -d @raven.js/cli` 与 `bunx raven init`，再在 Agent 中执行 raven-setup，步骤分散、体验不够顺畅。提供一个专注「只装 Skill」的 CLI 工具，可先完成 Skill 安装，之后在 Agent 中通过 raven-setup 一键完成项目中 @raven.js/cli 的安装与后续流程，降低上手门槛并统一入口。

## What Changes

- 新增名为 **install-raven** 的独立 CLI 工具，专门用于将 RavenJS 的 AI Skill 安装到当前项目（如 `.claude/skills/`），不负责安装 @raven.js/cli 或初始化 raven 目录。
- 用户安装该 CLI 后（如 `npx install-raven` 或全局安装），执行一次即可在项目中装好 Skill；此后在 Agent 中执行 **raven-setup** 即可。
- raven-setup 行为明确为：在**当前项目**中安装 `@raven.js/cli`（如通过 `bun add -d @raven.js/cli`），并在此基础上执行后续初始化与校验流程（如 `raven init`、添加 core、配置检查等）。
- **从 @raven.js/cli 中移除创建/安装 Skill 的能力**：`raven init` 仅负责创建 raven 根目录与 `raven.yaml`，不再向 `.claude/skills/` 写入 AI 资源；`raven update` 仅更新框架模块，不再更新 AI 资源。Skill 的安装与更新由 install-raven 负责。

## Capabilities

### New Capabilities

- `install-raven`: 独立 CLI，仅负责将 RavenJS 的 AI Skill 安装到项目的约定目录（如 `.claude/skills/`），不安装 @raven.js/cli、不创建 raven 根目录；安装完成后用户可在 Agent 中执行 raven-setup，由 raven-setup 在项目中安装 @raven.js/cli 并完成后续流程。

### Modified Capabilities

- `cli-tool`: `raven init` 不再安装 AI resources，仅创建 raven 根目录与 `raven.yaml`；`raven update` 不再更新 AI resources；移除与「CLI 安装/更新 Skill」相关的需求与选项（如 `raven init --source` 用于 AI 资源）；Skill 安装能力由 install-raven 提供。

## Impact

- 新增独立包或可执行入口 `install-raven`（发布为独立 npm 包或与现有 monorepo 集成），需考虑与现有 `@raven.js/cli` 的职责边界与发布流程。
- **@raven.js/cli**：移除 `raven init` 中写入 `.claude/skills/` 的逻辑及 `raven init --source`（AI 资源源）；移除 `raven update` 中更新 `.claude/skills/` 的逻辑；registry 的 `ai` 结构可保留供 install-raven 或文档使用，但主 CLI 不再读取或使用。
- 影响 AI 资源（Skill）的安装路径与来源：install-raven 从同一套 AI 资源（如 `packages/ai` 或发布产物）安装 Skill，与现有 registry/ai 结构兼容。
- raven-setup Skill 的说明与实现需约定「在项目中安装 @raven.js/cli 并执行后续步骤」，可能涉及 `packages/ai` 下 raven-setup 相关文档与脚本。
