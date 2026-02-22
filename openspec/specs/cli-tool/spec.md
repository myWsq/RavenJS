## ADDED Requirements

### Requirement: Raven CLI 工具可以全局安装

RavenJS SHALL 提供一个可通过 npm 全局安装的 CLI 工具，用户安装后可在任意目录使用 `raven` 命令。

#### Scenario: 全局安装 CLI
- **WHEN** 用户执行 `npm install -g @ravenjs/cli`
- **THEN** `raven` 命令可在终端全局使用

### Requirement: init 命令初始化项目

`raven init` SHALL 将 RavenJS core 代码复制到用户当前目录，并创建必要的项目结构。

#### Scenario: 执行 init 命令
- **WHEN** 用户在空目录执行 `raven init`
- **THEN** 创建 `src/raven/` 目录，包含 core 代码副本
- **AND** 创建 `.trae/skills/ravenjs/SKILL.md`
- **AND** 创建 `app.ts` 作为用户代码入口

#### Scenario: 目录非空时拒绝初始化
- **WHEN** 用户在非空目录执行 `raven init`
- **THEN** CLI 显示错误信息，提示用户选择空目录或指定子目录

### Requirement: add 命令添加功能模块

`raven add <feature>` SHALL 将指定的功能模块代码复制到用户项目。

#### Scenario: 添加 jtd-validator
- **WHEN** 用户执行 `raven add jtd-validator`
- **THEN** 将 jtd-validator 包代码复制到 `src/raven/jtd-validator/`

#### Scenario: 添加不存在的功能
- **WHEN** 用户执行 `raven add <不存在的功能>`
- **THEN** CLI 显示可用功能列表

### Requirement: update 命令更新代码

`raven update` SHALL 从 RavenJS 仓库拉取最新代码并更新用户目录中的副本。

#### Scenario: 执行 update 命令
- **WHEN** 用户执行 `raven update`
- **THEN** 提示用户先 commit 本地修改（如有）
- **AND** 从仓库拉取最新代码
- **AND** 更新 `src/raven/` 目录

#### Scenario: 有未提交的修改
- **WHEN** 用户有未 commit 的修改时执行 `raven update`
- **THEN** CLI 显示错误，提示先 commit 或 stash
