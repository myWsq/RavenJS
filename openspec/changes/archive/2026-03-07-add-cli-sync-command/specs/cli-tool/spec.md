## ADDED Requirements

### Requirement: raven sync Command

系统 SHALL 提供 `raven sync` 命令，把当前 Raven root 中已安装模块的本地代码对齐到当前 registry。命令 SHALL 以 `<root>/` 下现有模块目录为同步起点，基于 registry 的 `dependsOn` 计算当前需要保留的模块集合，并从内嵌 `dist/source/` 重新生成这些模块目录，而不是在原目录上做简单覆盖。

#### Scenario: sync 重建模块并清理残留文件

- **WHEN** user runs `raven sync` and `<root>/sql/` 中存在当前 registry 未声明的历史残留文件
- **THEN** the system SHALL 重新生成 `<root>/sql/` 的模块目录
- **AND** 仅保留当前 registry 为 `sql` 声明的文件内容
- **AND** 历史残留文件 SHALL 从最终目录中消失

#### Scenario: sync 补齐新增 dependsOn 模块

- **WHEN** 某个本地已安装模块在当前 registry 中新增了 `dependsOn: ["core"]`
- **AND** `<root>/core/` 当前不存在
- **THEN** `raven sync` SHALL 在同一次同步中安装 `<root>/core/`
- **AND** 最终本地模块集合 SHALL 包含该依赖模块

#### Scenario: sync 删除 registry 已移除模块

- **WHEN** user runs `raven sync` and `<root>/legacy-module/` 存在
- **AND** `legacy-module` 已不在当前 registry 中
- **THEN** the system SHALL 从最终同步结果中删除 `<root>/legacy-module/`
- **AND** sync 完成后该模块目录 SHALL 不再存在

#### Scenario: sync 更新 raven.yaml 版本

- **WHEN** user runs `raven sync` and 当前 registry 版本与 `<root>/raven.yaml` 中记录的版本不同
- **THEN** 成功的 sync SHALL 将 `raven.yaml` 的 `version` 更新为当前 registry 版本
- **AND** 已有的 `language` 字段 SHALL 被保留

#### Scenario: sync 需先 init

- **WHEN** user runs `raven sync` and Raven root 目录不存在
- **THEN** CLI SHALL 退出并提示用户先运行 `raven init`

### Requirement: Atomic raven sync

`raven sync` SHALL 以 Raven root 为粒度进行事务式提交。系统 SHALL 在 staging 目录中先构建完整目标状态，在 staging 成功前不得修改 live root；如果最终切换失败，系统 SHALL 恢复同步前的原始 root。

#### Scenario: staging 失败时保持原样

- **WHEN** `raven sync` 在 staging 阶段遇到错误，例如某个内嵌源文件缺失
- **THEN** the command SHALL 以错误结束
- **AND** 原始 `<root>/` 下的文件内容 SHALL 保持不变

#### Scenario: 最终切换失败时自动回滚

- **WHEN** staging 已完成，但将 staging root 切换为正式 `<root>/` 时发生失败
- **THEN** the system SHALL 自动恢复同步前的 `<root>/`
- **AND** 命令结束后用户 SHALL 不会看到部分模块已更新、部分模块仍为旧版本的中间态
