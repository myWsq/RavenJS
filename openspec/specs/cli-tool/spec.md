## ADDED Requirements

### Requirement: Raven CLI 工具可以全局安装

RavenJS SHALL 提供一个可通过 npm 全局安装的 CLI 工具，用户安装后可在任意目录使用 `raven` 命令。

#### Scenario: 全局安装 CLI
- **WHEN** 用户执行 `npm install -g @ravenjs/cli`
- **THEN** `raven` 命令可在终端全局使用

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

### Requirement: add 命令添加功能模块

`raven add <feature>` SHALL 将指定的功能模块代码复制到用户项目。

#### Scenario: 添加 jtd-validator
- **WHEN** 用户执行 `raven add jtd-validator`
- **THEN** 将 jtd-validator 包代码复制到 `src/raven/jtd-validator/`

#### Scenario: 添加不存在的功能
- **WHEN** 用户执行 `raven add <不存在的功能>`
- **THEN** CLI 显示可用功能列表

### Requirement: raven update Command
The system SHALL update installed RavenJS modules AND AI resources when `raven update` is executed.

#### Scenario: raven update updates framework modules
- **WHEN** user runs `raven update`
- **THEN** all installed modules in `raven/` are updated
- **AND** `raven.yaml` is updated with latest version

#### Scenario: raven update updates AI resources
- **WHEN** user runs `raven update` AND `.claude/` exists with AI resources
- **THEN** AI skills in `.claude/skills/` are updated
- **AND** AI commands in `.claude/commands/` are updated
- **AND** success message includes both framework and AI resources

#### Scenario: raven update when AI resources not installed
- **WHEN** user runs `raven update` AND `.claude/` does NOT exist
- **THEN** only framework modules are updated
- **AND** no error is raised about missing AI resources

#### Scenario: raven update shows combined progress
- **WHEN** user runs `raven update`
- **THEN** progress indicator shows both framework and AI resource updates
- **AND** final summary lists all modified files
