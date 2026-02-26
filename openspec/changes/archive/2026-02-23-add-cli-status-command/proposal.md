## Why

目前 skills 和 commands 中通过写死「检查是否存在 raven/ 目录」等逻辑来判断 RavenJS 是否已安装。这种硬编码方式难以维护，且无法准确反映 ai、core、modules 各自的安装状态。Agent 需要统一、可调用的手段来获取当前项目的 Raven 安装情况，以便在 skill 和 command 中动态判断是否需要执行 install/init。

## What Changes

- 新增 `raven status` CLI 命令
- 命令输出当前项目的 Raven 安装状态，包括：`core`（raven/core）、`modules`（raven/ 下各模块），仅关注 raven 根目录
- 输出格式支持人类可读与机器可解析（如 `--json` 选项），便于 agent 调用
- 更新 packages/ai 中相关 skill 和 command，改为通过调用 `raven status` 判断安装状态，移除硬编码检查

## Capabilities

### New Capabilities

- `cli-status-command`: `raven status` 命令，列出 ai、core、modules 的安装状态，支持 agent 调用以动态判断是否已安装

### Modified Capabilities

- `cli-ai-commands`: AI 相关 skill/command 通过 `raven status` 判断安装状态，不再写死目录检查逻辑

## Impact

- `packages/cli/index.ts`：新增 `status` 命令及 `cmdStatus` 实现
- `packages/ai/`：install、add 等 skill 和 command 文档更新，改为指导 agent 使用 `raven status` 判断
