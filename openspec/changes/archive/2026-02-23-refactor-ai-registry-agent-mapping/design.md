## Context

当前 registry 的 `ai` 字段为 `{ files: string[], fileMapping: Record<string, string> }`。`files` 与 `fileMapping` 的 key 一致，冗余且易出错。CLI 与 generate-registry 均需维护两处。同时，不同 AI 代理（Claude、Cursor）的安装目标不同，当前单一结构无法支持。

## Goals / Non-Goals

**Goals:**

- 移除 `ai.files`，仅保留 mapping，源文件列表从 `Object.keys(mapping)` 推导
- 支持多 agent：`ai.claude`、`ai.cursor` 等，各 agent 下为 `{ sourcePath: destPath }`
- CLI 默认使用 `ai.claude`，保持现有 `.claude/` 安装行为不变

**Non-Goals:**

- 不增加 `raven init --agent cursor` 等运行时选择（本次只做结构预留）
- 不修改 raven init/update 的对外 CLI 接口
- 不实现 Cursor 的 mapping 与安装逻辑（仅保留扩展点）

## Decisions

1. **Registry `ai` 新结构**
   - `ai`: `{ claude: Record<sourcePath, destPath>, cursor?: Record<...>, ... }`
   - 每个 agent 的 key 为 packages/ai 内的相对路径，value 为安装目标相对路径（相对项目根）
   - Alternative: 保留 `ai.files` 作为全局列表 + agent 各自 mapping — rejected，增加复杂度

2. **packages/ai/package.json 结构**
   - 移除顶层 `files`，改为 `agents: { claude: Record<sourcePath, destPath> }` 或等价结构
   - generate-registry 从 `agents.claude` 等读取，输出到 registry 的 `ai.claude`

3. **CLI 读取逻辑**
   - `downloadAiResources` 读取 `registry.ai.claude`（硬编码 agent 为 claude，后续可扩展）
   - 源文件列表：`Object.keys(registry.ai.claude)`
   - 下载/复制时：`source = packages/ai/<key>`，`dest = <value>`

4. **generate-registry 行为**
   - 从 packages/ai/package.json 的 `agents` 或 `claude` 读取 mapping
   - 输出 `ai: { claude: mapping }`，不再输出 `files`

## Risks / Trade-offs

- **[Breaking] 旧 registry 格式** → 已发布 registry 含 `ai.files` + `ai.fileMapping`，新 CLI 需兼容或要求 regenerate；建议同一 release 内同步更新 registry 与 CLI，避免版本错配。
- **agent 命名** → 使用小写 `claude`、`cursor` 与常见品牌一致。

## Migration Plan

1. 更新 packages/ai/package.json：移除 `files`，改为 `agents.claude` (或 `claude`) 下的 mapping
2. 更新 generate-registry.ts：读取 agents/claude，输出 `ai.claude`
3. 更新 packages/cli/index.ts：`downloadAiResources` 使用 `ai.claude`，`Object.keys(ai.claude)` 作为文件列表
4. Regenerate registry.json，验证 init/update 行为
