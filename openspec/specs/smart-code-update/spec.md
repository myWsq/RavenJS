# Smart Code Update Specification

## Purpose

定义 RavenJS 代码更新的两种模式：未修改直接覆盖、已修改智能合并。

## Requirements

### Requirement: No pre-computed change analysis

系统 SHALL NOT 提供预计算的变更语义分析。变更理解仍由 Agent 完成，但分析入口应基于 Git diff 与更新后的 RavenJS 文档，而不是依赖不存在的 `raven diff` 命令。

#### Scenario: Agent analyzes changes itself

- **WHEN** an Agent needs to understand what changed after a RavenJS update
- **THEN** the Agent SHALL use Git diff together with updated RavenJS docs to analyze the change
- **AND** the system SHALL NOT require a pre-computed change summary from the CLI
