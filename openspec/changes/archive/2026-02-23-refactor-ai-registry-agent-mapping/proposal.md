## Why

Registry 中 `ai.files` 与 `ai.fileMapping` 冗余：文件列表可从 `Object.keys(fileMapping)` 推导，维护两处易出错。同时，不同 AI 代理（Claude、Cursor 等）的安装目标路径不同（如 Claude 用 `.claude/`，Cursor 可能用 `.cursor/`），当前单一样本无法支持多 agent。

## What Changes

- **BREAKING**: 移除 `ai.files`，仅保留 mapping 形式，以 mapping 的 key 作为源文件列表
- 将 `ai` 改为按 agent 区分的结构：`ai.claude`、`ai.cursor` 等，每个 agent 下为 `{ sourcePath: destPath }` 的 mapping
- 默认使用 Claude 的 mapping（向后兼容：CLI 若无 agent 选项则用 `ai.claude`）

## Capabilities

### New Capabilities

- `registry-ai-agent-schema`: Registry `ai` 顶层改为按 agent 分组的 mapping 结构，移除 `files`，支持 `ai.claude`、`ai.cursor` 等

### Modified Capabilities

- `ai-first-integration`: AI 资源注册与安装逻辑改为从 `ai.<agent>` 读取 mapping，不再使用 `ai.files` / `ai.fileMapping`

## Impact

- `packages/cli/registry.json`：结构变更，需 regenerate
- `packages/cli/index.ts`：`downloadAiResources` 改为读取 `ai.claude`（或可配置 agent）
- `packages/cli/scripts/generate-registry.ts`：输出新结构
- `packages/ai/package.json`：改为 agent 维度的 mapping（如 `claude` 下的 mapping），不再有 `files` + `fileMapping` 冗余
