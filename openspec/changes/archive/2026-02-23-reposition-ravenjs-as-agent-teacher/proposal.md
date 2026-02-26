## Why

ravenjs 当前定位是一个传统的 npm 框架，但这与 AI 时代的开发方式不匹配。我们需要重新定位 ravenjs，让它成为 Agent 的"老师"而非用户的"框架"，通过教学让 Agent 学会如何写代码，而非直接提供黑盒框架代码。

## What Changes

- **SKILL 体系重构**：新增/调整 SKILL（raven-learn、raven-install、raven-check-update、raven-merge）
- **CLI 重新设计**：所有命令输出面向 Agent（JSON 格式），仅保留 raven init 给人类使用
- **README.md 重构**：仅保留 README.md，内容结构面向 Agent，解释设计意图和架构
- **更新工作流**：支持两种更新模式（未修改直接覆盖、已修改智能合并）

## Capabilities

### New Capabilities

- `agent-first-experience`: 重新定位 ravenjs 为 Agent 的教学工具
- `agent-focused-cli`: CLI 输出全部面向 Agent（JSON 格式）
- `agent-teaching-docs`: README.md 重构为 Agent 专用教学文档
- `smart-code-update`: 支持两种更新模式（直接覆盖/智能合并）

### Modified Capabilities

- `cli-tool`: 重新设计 CLI 为 Agent 优先
- `core-framework`: 框架代码作为教学参考，而非依赖

## Impact

- `packages/cli/index.ts`: 重新设计 CLI 命令和输出格式
- `modules/*/README.md`: 重构为 Agent 专用教学文档
- `.claude/skills/`: 新增/调整 SKILL
- `openspec/specs/`: 新增相应 spec 文件
