# raven-update-skill Specification

## Purpose

TBD - created by archiving change add-raven-update-skill. Update Purpose after archive.

## Requirements

### Requirement: install-raven distributes raven-update skill

系统 SHALL 将 `raven-update` 作为默认分发的 RavenJS AI skill 之一，使 Agent 可以通过统一入口执行项目升级流程。该 skill SHALL 与 `raven-setup`、`raven-learn`、`raven-use` 一起被安装，并 SHALL NOT 再与 `raven-add` 绑定成默认工作流的一部分。

#### Scenario: install-raven copies raven-update skill

- **WHEN** 用户在项目目录运行 `install-raven`（或 `npx install-raven`）
- **THEN** 安装结果 SHALL 包含 `raven-update/SKILL.md`
- **AND** 该 skill SHALL 与 `raven-setup`、`raven-learn`、`raven-use` 一起被安装
- **AND** 默认分发结果 SHALL NOT 包含 `raven-add`

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

`raven-update` skill SHALL 在执行 CLI 升级之前检查当前目录位于 Git 工作区且整个工作区干净，以保证本次升级 diff 以清晰的仓库基线开始。该基线检查 SHALL 仅在升级开始前判定；当 `bun add -d @raven.js/cli@latest` 产生 `package.json`、锁文件等依赖清单改动后，skill SHALL 继续执行 `bunx raven sync`，而 SHALL NOT 因这些由升级本身产生的改动再次要求用户清理工作区。

#### Scenario: dirty worktree before update stops the skill

- **WHEN** Agent 执行 `raven-update` skill 且在任何升级命令开始前 `git status --porcelain` 返回非空
- **THEN** skill SHALL 停止执行
- **AND** skill SHALL 提示用户先提交、暂存或备份当前改动
- **AND** skill SHALL NOT 运行 `bun add -d @raven.js/cli@latest`

#### Scenario: non-git directory stops the skill

- **WHEN** Agent 执行 `raven-update` skill 且当前目录不在 Git 工作区内
- **THEN** skill SHALL 停止执行
- **AND** skill SHALL 提示用户先初始化 Git 或创建可恢复备份

#### Scenario: CLI upgrade modifies manifests but skill continues to sync

- **WHEN** Agent 在干净的 Git 基线上执行 `raven-update` skill
- **AND** `bun add -d @raven.js/cli@latest` 仅产生本次升级预期的依赖清单或锁文件改动
- **THEN** skill SHALL 继续使用项目本地 CLI 执行 `bunx raven sync`
- **AND** skill SHALL 以升级开始前的干净基线分析后续完整 Git diff

### Requirement: raven-update skill analyzes diffs and adapts breaking changes

`raven-update` skill SHALL 在 `bunx raven sync` 完成后分析 Git diff；如果更新带来了 breaking changes，skill SHALL 继续修改用户项目代码完成兼容性适配，而不是仅给出提示。该分析 SHALL 重点围绕 `raven/core/` 与受管理示例资产的变化，而不是基于模块集合做推导。

#### Scenario: update without breaking changes

- **WHEN** Agent 执行 `raven-update` skill 且同步后的 diff 未显示用户项目需要兼容性改动
- **THEN** skill SHALL 总结本次 CLI、`raven/core/` 与受管理示例资产的变更
- **AND** skill SHALL NOT 修改无关的业务代码

#### Scenario: update with breaking changes

- **WHEN** Agent 执行 `raven-update` skill 且同步后的 diff 显示 Raven core API、目录结构或配置契约发生破坏性变化
- **THEN** skill SHALL 读取受影响的 core 文档与相关示例资产
- **AND** skill SHALL 修改用户项目代码以适配新的契约
- **AND** skill SHALL 在结果中说明做了哪些兼容性修复
