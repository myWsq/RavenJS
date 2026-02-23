# Smart Code Update Specification

## Purpose

定义 RavenJS 代码更新的两种模式：未修改直接覆盖、已修改智能合并。

## Requirements

### Requirement: Two update modes supported
The system SHALL support two update modes:
1. Direct overwrite (when user has not modified RavenJS code)
2. Smart merge (when user has modified RavenJS code)

#### Scenario: Update when user has not modified
- **WHEN** user wants to update RavenJS code
- **AND** user has NOT modified any RavenJS files
- **THEN** the latest code SHALL be directly overwritten

#### Scenario: Update when user has modified
- **WHEN** user wants to update RavenJS code
- **AND** user HAS modified RavenJS files
- **THEN** the Agent SHALL perform a smart merge

### Requirement: Agent detects modifications
The Agent SHALL be able to detect whether the user has modified RavenJS code from the original version.

#### Scenario: Agent checks for modifications
- **WHEN** an Agent runs `raven status`
- **THEN** the output SHALL indicate which files have been modified (via file hashes; use `raven diff` to compare)

### Requirement: Smart merge preserves user changes
When performing a smart merge, the Agent SHALL preserve the user's modifications while applying updates from RavenJS.

#### Scenario: Smart merge preserves user changes
- **WHEN** an Agent performs a smart merge
- **THEN** the user's custom logic SHALL be preserved
- **AND** RavenJS updates SHALL be applied

### Requirement: No pre-computed change analysis
The system SHALL NOT provide pre-computed change analysis. Change understanding SHALL be left to the Agent.

#### Scenario: Agent analyzes changes itself
- **WHEN** an Agent needs to understand what changed
- **THEN** the Agent SHALL use `raven diff` and README.md to analyze
- **AND** no pre-computed change description SHALL be provided
