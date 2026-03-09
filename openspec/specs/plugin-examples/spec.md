# plugin-examples Specification

## Purpose

TBD - created by archiving change remove-module-system. Update Purpose after archive.

## Requirements

### Requirement: Example plugins are shipped as teaching assets, not installable modules

RavenJS SHALL 将官方示例 plugin 作为教学资产随 core 一起分发，而不是作为独立可安装模块。示例资产 SHALL 安装到 Raven root 下的 `<root>/examples/` 目录，并 SHALL NOT 出现在 `raven status` 的可安装能力描述中。

#### Scenario: init installs managed example assets

- **WHEN** 用户运行 `raven init`
- **THEN** Raven root 下 SHALL 创建 `<root>/examples/`
- **AND** 受管理示例资产 SHALL 被安装到该目录下

#### Scenario: status does not expose examples as modules

- **WHEN** Agent 或用户运行 `raven status`
- **THEN** 输出 SHALL 只描述 Raven core 的安装状态
- **AND** 示例 plugin SHALL NOT 被表示为单独可安装项

### Requirement: RavenJS provides a SQL plugin example

RavenJS SHALL 提供一个 SQL plugin 示例，展示如何使用 `definePlugin`、`defineAppState` 与 `Bun.SQL` 组合出 database plugin。该示例 SHALL 安装到 `<root>/examples/sql-plugin/`，并由 core 的学习文档显式引用。

#### Scenario: SQL plugin example is installed with Raven

- **WHEN** 用户运行 `raven init` 或 `raven sync`
- **THEN** `<root>/examples/sql-plugin/` SHALL 存在
- **AND** 目录中 SHALL 包含可供 Agent 学习的示例源码

#### Scenario: core docs link to SQL plugin example

- **WHEN** Agent 阅读 Raven core 的 GUIDE 或 README
- **THEN** 文档 SHALL 明确指出 SQL plugin 示例的路径
- **AND** 说明该示例用于学习 plugin / state / database 集成模式
