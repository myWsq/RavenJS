## MODIFIED Requirements

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
