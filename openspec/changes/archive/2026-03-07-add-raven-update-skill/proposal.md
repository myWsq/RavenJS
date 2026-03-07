## Why

当前 RavenJS 的升级流程分散在 README 和人工操作里：用户需要自己升级项目内的 `@raven.js/cli`、执行 `bunx raven sync`、再分析 `raven/` 与业务代码的受影响范围。仓库当前也没有专门的 update skill 来约束这条流程，Agent 很容易跳过关键安全步骤，尤其是在工作区已有未提交改动时直接执行 `sync`，会放大误操作和回退困难的风险。

## What Changes

- 新增 `raven-update` AI skill，指导 Agent 在项目内升级 `@raven.js/cli`，并使用项目本地 CLI 完成 RavenJS 更新。
- `raven-update` skill 在执行 `bunx raven sync` 前必须检查当前目录位于 Git 工作区且工作区干净；若不满足条件则停止并提示用户先提交、暂存或备份改动。
- `raven-update` skill 在 `sync` 之后使用 Git diff 分析 `raven/` 和项目代码的变化，识别 breaking changes 以及受影响的应用代码。
- 当更新引入 breaking changes 时，`raven-update` skill 需要继续修改用户项目代码以完成适配，而不是只停留在“提示有破坏性变更”。
- 更新安装产物与文档，使 `raven-update` 成为默认分发的 RavenJS AI skill 之一，并在 README 中说明推荐的更新入口。
- 修改 CLI `sync` 行为：命令必须在干净的 Git 工作区执行；如果当前目录不在 Git 仓库内，或存在未提交改动，CLI 必须拒绝执行并给出明确提示。
- 清理围绕旧更新模型留下的过时规范与 CLI 无用代码，尤其是移除 `raven status` 中不再服务当前流程的 diff/hash 类字段，不保留兼容输出。

## Capabilities

### New Capabilities

- `raven-update-skill`: 定义 RavenJS 更新 skill 的触发条件、CLI 升级流程、`sync` 后 diff 分析，以及 breaking change 适配职责。

### Modified Capabilities

- `cli-tool`: 修改 `raven sync` 的前置条件，要求命令只能在干净的 Git 工作区中执行，并在条件不满足时拒绝同步。
- `agent-focused-cli`: 将 Agent 消费的 CLI 状态模型收敛到当前真实输出，移除对 `latest version`、`raven diff`、`file hashes`、`raven guide` 的过时要求。
- `smart-code-update`: 将“智能更新”定义改为当前推荐流程：干净 Git 基线、升级项目本地 CLI、执行 `raven sync`、分析 Git diff 并适配 breaking changes。

## Impact

- `packages/install-raven/skills/`：新增 `raven-update/SKILL.md`，并补充相关文档。
- `README.md` 与 `packages/cli/README.md`：补充推荐的更新工作流与 skill 入口。
- `packages/cli/index.ts`：为 `raven sync` 增加 Git 工作区校验与错误提示，并移除 `raven status` 中无用的 diff/hash 相关输出与辅助代码。
- `tests/e2e/cli.test.ts`：新增 `sync` 在脏工作区、非 Git 工作区下的失败测试。
- `openspec/changes/add-raven-update-skill/specs/`：补充对 `agent-focused-cli` 与 `smart-code-update` 的 delta spec，覆盖旧更新流程和旧状态模型的清理。
