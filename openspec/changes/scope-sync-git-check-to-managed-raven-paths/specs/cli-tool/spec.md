## MODIFIED Requirements

### Requirement: raven sync requires a clean Git worktree

`raven sync` SHALL 仅在当前目录位于 Git 工作区且本次同步将覆盖、重建或删除的 Raven 受管路径干净时执行。受管路径至少包括 `<root>/raven.yaml`、`<root>/core/**` 以及 `<root>/` 下将被同步删除的 legacy 目录。若 Git 不可用、当前目录不在 Git 工作区内，或这些受管路径存在未提交改动，命令 SHALL 在开始 staging 之前失败，并且不得修改 live Raven root。工作区中位于受管路径之外的改动 SHALL NOT 阻止 `raven sync`。

#### Scenario: sync proceeds when unrelated repo files are dirty

- **WHEN** 用户在 Git 工作区中运行 `raven sync`
- **AND** 工作区中的未提交改动仅存在于 Raven 受管路径之外，例如 `package.json`、锁文件或应用源码
- **AND** `<root>/raven.yaml`、`<root>/core/**` 与将被删除的 legacy 目录均无未提交改动
- **THEN** 命令 SHALL 继续执行现有的 sync 流程

#### Scenario: sync proceeds when passthrough files under root are dirty

- **WHEN** 用户在 Git 工作区中运行 `raven sync`
- **AND** `<root>/` 根目录下存在会被原样保留的普通文件改动
- **AND** `<root>/raven.yaml`、`<root>/core/**` 与将被删除的 legacy 目录均无未提交改动
- **THEN** 命令 SHALL 继续执行现有的 sync 流程

#### Scenario: sync fails when managed Raven files are dirty

- **WHEN** 用户在 Git 工作区中运行 `raven sync`
- **AND** `<root>/raven.yaml` 或 `<root>/core/**` 存在未提交改动
- **THEN** CLI SHALL 退出并提示用户先提交、暂存或备份受管 Raven 改动
- **AND** `<root>/` 下的文件 SHALL 保持不变

#### Scenario: sync fails when legacy directories to be deleted are dirty

- **WHEN** 用户在 Git 工作区中运行 `raven sync`
- **AND** `<root>/` 下某个将被同步删除的 legacy 目录存在未提交改动
- **THEN** CLI SHALL 退出并提示用户先处理该目录中的改动
- **AND** `<root>/` 下的文件 SHALL 保持不变

#### Scenario: sync fails outside a Git worktree

- **WHEN** 用户在不属于 Git 工作区的目录中运行 `raven sync`
- **THEN** CLI SHALL 退出并提示用户先初始化 Git 或创建可恢复备份
- **AND** `<root>/` 下的文件 SHALL 保持不变

#### Scenario: sync fails when Git is unavailable

- **WHEN** 用户运行 `raven sync` 且执行 Git 检查失败，因为系统中不存在 `git` 命令
- **THEN** CLI SHALL 退出并提示用户安装 Git 后再执行同步
- **AND** `<root>/` 下的文件 SHALL 保持不变
