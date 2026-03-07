## ADDED Requirements

### Requirement: raven sync requires a clean Git worktree

`raven sync` SHALL 仅在当前目录位于 Git 工作区且工作区干净时执行。若 Git 不可用、当前目录不在 Git 工作区内，或存在未提交改动，命令 SHALL 在开始 staging 之前失败，并且不得修改 live Raven root。

#### Scenario: sync proceeds in a clean Git worktree

- **WHEN** 用户在 Git 工作区中运行 `raven sync`
- **AND** `git status --porcelain` 返回空结果
- **THEN** 命令 SHALL 继续执行现有的 sync 流程

#### Scenario: sync fails outside a Git worktree

- **WHEN** 用户在不属于 Git 工作区的目录中运行 `raven sync`
- **THEN** CLI SHALL 退出并提示用户先初始化 Git 或创建可恢复备份
- **AND** `<root>/` 下的文件 SHALL 保持不变

#### Scenario: sync fails in a dirty Git worktree

- **WHEN** 用户在 Git 工作区中运行 `raven sync`
- **AND** `git status --porcelain` 返回未提交改动
- **THEN** CLI SHALL 退出并提示用户先提交或暂存改动
- **AND** `<root>/` 下的文件 SHALL 保持不变

#### Scenario: sync fails when Git is unavailable

- **WHEN** 用户运行 `raven sync` 且执行 Git 检查失败，因为系统中不存在 `git` 命令
- **THEN** CLI SHALL 退出并提示用户安装 Git 后再执行同步
- **AND** `<root>/` 下的文件 SHALL 保持不变

## MODIFIED Requirements

### Requirement: CLI provides structured information for Agent

CLI SHALL 提供当前真实可消费的 Agent 状态信息：当前 Raven 版本、交互语言，以及模块的安装状态与安装目录。CLI SHALL NOT 要求 `raven status` 暴露 `latest version`、`file hashes` 或其他 diff/hash 衍生字段。

#### Scenario: Agent checks status

- **WHEN** an Agent runs `raven status`
- **THEN** 输出 SHALL 包含当前版本、语言和 `modules` 数组
- **AND** 每个模块条目 SHALL 至少包含 `name`、`installed` 和 `installDir`
- **AND** 输出 SHALL NOT 包含 `latest version` 或 `file hashes` 作为必需信息

## REMOVED Requirements

### Requirement: CLI provides guidance entry points

**Reason**: 当前 CLI 不提供 `raven guide`，更新流程与模块学习流程已改为由 Agent 直接读取已安装模块文档并结合 Git diff 分析变化。

**Migration**: 使用 `raven status` 获取模块安装目录，再直接读取该目录下的 `GUIDE.md`、`README.md` 和 pattern 文档；更新差异分析改用 Git diff。
