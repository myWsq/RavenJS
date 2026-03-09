## MODIFIED Requirements

### Requirement: install-raven distributes raven-update skill

系统 SHALL 将 `raven-update` 作为默认分发的 RavenJS AI skill 之一，使 Agent 可以通过统一入口执行项目升级流程。该 skill SHALL 与 `raven-setup`、`raven-learn`、`raven-use` 一起被安装，并 SHALL NOT 再与 `raven-add` 绑定成默认工作流的一部分。

#### Scenario: install-raven copies raven-update skill

- **WHEN** 用户在项目目录运行 `install-raven`（或 `npx install-raven`）
- **THEN** 安装结果 SHALL 包含 `raven-update/SKILL.md`
- **AND** 该 skill SHALL 与 `raven-setup`、`raven-learn`、`raven-use` 一起被安装
- **AND** 默认分发结果 SHALL NOT 包含 `raven-add`

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
