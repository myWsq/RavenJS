## MODIFIED Requirements

### Requirement: install 命令安装项目

`raven install` SHALL 将 RavenJS core 代码复制到用户当前目录，并创建必要的项目结构。

#### Scenario: 执行 install 命令
- **WHEN** 用户在空目录执行 `raven install`
- **THEN** 创建 `src/raven/` 目录，包含 core 代码副本
- **AND** 创建 `.trae/skills/ravenjs/SKILL.md`
- **AND** 创建 `app.ts` 作为用户代码入口

#### Scenario: 目录非空时拒绝安装
- **WHEN** 用户在非空目录执行 `raven install`
- **THEN** CLI 显示错误信息，提示用户选择空目录或指定子目录
