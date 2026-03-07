# raven-update-skill Specification

## Purpose

TBD - created by archiving change add-raven-update-skill. Update Purpose after archive.

## Requirements

### Requirement: install-raven distributes raven-update skill

系统 SHALL 将 `raven-update` 作为默认分发的 RavenJS AI skill 之一，使 Agent 可以通过统一入口执行项目升级流程。

#### Scenario: install-raven copies raven-update skill

- **WHEN** 用户在项目目录运行 `install-raven`（或 `npx install-raven`）
- **THEN** 安装结果 SHALL 包含 `raven-update/SKILL.md`
- **AND** 该 skill SHALL 与 `raven-setup`、`raven-add`、`raven-learn`、`raven-use` 一起被安装

### Requirement: raven-update skill upgrades the project-local CLI before sync

`raven-update` skill SHALL 指导 Agent 先升级项目内的 `@raven.js/cli`，再使用项目本地 CLI 执行 `bunx raven sync`，而不是依赖已移除或不存在的历史命令。

#### Scenario: Bun missing blocks the update skill

- **WHEN** Agent 执行 `raven-update` skill 且 `bun --version` 失败
- **THEN** skill SHALL 停止执行
- **AND** skill SHALL 提示用户先安装 Bun

#### Scenario: skill upgrades CLI before sync

- **WHEN** Agent 按照 `raven-update` skill 执行升级流程且 Bun 可用
- **THEN** skill SHALL 指导 Agent 先运行 `bun add -d @raven.js/cli@latest`
- **AND** 随后 SHALL 使用项目本地 CLI 执行 `bunx raven sync`

### Requirement: raven-update skill requires a clean Git baseline

`raven-update` skill SHALL 在执行 CLI 升级或 `sync` 之前检查当前目录位于 Git 工作区且工作区干净，以保证升级 diff 只反映本次更新。

#### Scenario: dirty worktree stops the skill

- **WHEN** Agent 执行 `raven-update` skill 且 `git status --porcelain` 返回非空
- **THEN** skill SHALL 停止执行
- **AND** skill SHALL 提示用户先提交、暂存或备份当前改动
- **AND** skill SHALL NOT 运行 `bunx raven sync`

#### Scenario: non-git directory stops the skill

- **WHEN** Agent 执行 `raven-update` skill 且当前目录不在 Git 工作区内
- **THEN** skill SHALL 停止执行
- **AND** skill SHALL 提示用户先初始化 Git 或创建可恢复备份

### Requirement: raven-update skill analyzes diffs and adapts breaking changes

`raven-update` skill SHALL 在 `bunx raven sync` 完成后分析 Git diff；如果更新带来了 breaking changes，skill SHALL 继续修改用户项目代码完成兼容性适配，而不是仅给出提示。

#### Scenario: update without breaking changes

- **WHEN** Agent 执行 `raven-update` skill 且同步后的 diff 未显示用户项目需要兼容性改动
- **THEN** skill SHALL 总结本次 CLI 与 `raven/` 目录变更
- **AND** skill SHALL NOT 修改无关的业务代码

#### Scenario: update with breaking changes

- **WHEN** Agent 执行 `raven-update` skill 且同步后的 diff 显示 RavenJS API、目录结构或配置契约发生破坏性变化
- **THEN** skill SHALL 读取受影响模块的更新后文档与代码差异
- **AND** skill SHALL 修改用户项目代码以适配新的契约
- **AND** skill SHALL 在结果中说明做了哪些兼容性修复
