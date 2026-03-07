# Agent Focused CLI Specification

## Purpose

定义 CLI 面向 Agent 的输出格式与结构化信息，使 Agent 能程序化消费 CLI 输出。

## Requirements

### Requirement: All CLI outputs in JSON format

All RavenJS CLI commands SHALL output JSON format by default, with the exception of `raven init` and `raven guide`.

#### Scenario: CLI command outputs JSON

- **WHEN** an Agent runs any RavenJS CLI command except `raven init` and `raven guide`
- **THEN** the output SHALL be valid JSON

#### Scenario: raven init for human use

- **WHEN** a human runs `raven init`
- **THEN** the output SHALL be human-friendly (non-JSON)

### Requirement: CLI provides structured information for Agent

CLI SHALL 向 Agent 提供当前真实可消费的状态信息：当前 Raven 版本、交互语言，以及模块的安装状态与安装目录。CLI SHALL NOT 要求 `raven status` 提供 `latest version`、`modified file status` 或 `file hashes` 这类旧字段。

#### Scenario: Agent checks status

- **WHEN** an Agent runs `raven status`
- **THEN** 输出 SHALL 包含当前版本、语言和 `modules` 数组
- **AND** 每个模块条目 SHALL 至少包含 `name`、`installed` 和 `installDir`
- **AND** 输出 SHALL NOT 依赖 `latest version` 或 `file hashes`
