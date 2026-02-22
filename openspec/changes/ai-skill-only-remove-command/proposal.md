## Why

AI 模块中 skill 与 command 高度重复：install 和 add 各自有 skill.md 与 command.md，内容重叠（如「何时使用」「检查 raven status」「执行安装」）。维护两套文档增加负担且易不一致。只保留 skill 即可满足 AI 识别与执行需求，command 可移除。

## What Changes

- **BREAKING**: 移除 `packages/ai` 下所有 command.md，只保留 skill.md
- **BREAKING**: 不再安装到 `.claude/commands/`，只安装到 `.claude/skills/`
- 更新 `packages/ai/package.json` 的 `claude` mapping，去除 command 相关条目
- 若 skill 内容不足，将 command 中有价值的部分（Steps、 Guardrails）合并进 skill

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `ai-first-integration`: 移除 AI Commands 相关需求，仅保留 Skills 安装；更新 AI Resource Registry 说明，去掉 commands 引用
- `registry-ai-agent-schema`: 示例与描述不再提及 `.claude/commands/`，仅 skills
- `cli-ai-commands`: 将 `raven init` 安装「skills 和 commands」改为仅安装 skills；移除 `.claude/commands/` 相关 scenario
- `ai-package`: 移除 Commands directory 要求，改为仅描述 skills 结构
- `cli-tool`: raven update 场景改为仅更新 skills，不再提及 commands

## Impact

- `packages/ai/`: 删除 `install/command.md`、`add/command.md`；更新 `package.json` 的 claude mapping
- `packages/cli/scripts/generate-registry.ts`: 无改动（从 package.json 读取，移除 command 条目后自动生效）
- 用户项目：已安装的 `.claude/commands/` 在 `raven update` 时不再更新；可建议用户手动清理
