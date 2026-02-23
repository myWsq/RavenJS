# Agent Teaching Docs Specification

## Purpose

定义 RavenJS 模块文档结构，确保 README 面向 Agent 学习设计。

## Requirements

### Requirement: Only README.md provided
RavenJS SHALL only provide a README.md file for each module. No additional documentation files (DESIGN.md, CHANGELOG.md, TEACHING.md, etc.) SHALL be created.

#### Scenario: Module documentation structure
- **WHEN** an Agent looks at a RavenJS module
- **THEN** only README.md SHALL exist

### Requirement: README.md structured for Agent learning
The README.md SHALL be structured specifically for Agent learning, with clear sections explaining design intent and architecture.

#### Scenario: README.md contains learning sections
- **WHEN** an Agent reads README.md
- **THEN** the README SHALL contain these sections: OVERVIEW, HOW TO READ THIS CODE, CORE CONCEPTS, ARCHITECTURE, DESIGN DECISIONS, KEY CODE LOCATIONS, EXTENSION POINTS, USAGE EXAMPLES

### Requirement: README.md explains "why" not just "what"
The README.md SHALL focus on explaining design decisions and rationale, not just API documentation.

#### Scenario: README.md explains design decisions
- **WHEN** an Agent reads the DESIGN DECISIONS section
- **THEN** the Agent SHALL understand why certain choices were made over alternatives

### Requirement: No Changelog maintained
RavenJS SHALL NOT maintain a Changelog file. Change tracking SHALL be left to git history and Agent analysis.

#### Scenario: No Changelog file exists
- **WHEN** an Agent looks for Changelog
- **THEN** no Changelog file SHALL exist
