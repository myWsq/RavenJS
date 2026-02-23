## ADDED Requirements

### Requirement: RavenJS as Agent Teaching Tool
RavenJS SHALL be positioned as an Agent teaching tool rather than a traditional npm framework. The primary audience SHALL be AI Agents, not human developers directly.

#### Scenario: Agent learns from RavenJS
- **WHEN** an Agent uses raven-learn SKILL
- **THEN** the Agent SHALL understand RavenJS's design philosophy and architecture

#### Scenario: Agent generates code based on teaching
- **WHEN** an Agent has learned RavenJS
- **THEN** the Agent SHALL be able to write code in RavenJS's style without requiring the framework as a dependency

### Requirement: Initial code provided for bootstrap
RavenJS SHALL provide initial reference code to bootstrap a project. The initial code SHALL be complete and runnable.

#### Scenario: Agent installs initial code
- **WHEN** an Agent uses raven-install SKILL
- **THEN** the Agent SHALL have RavenJS code in the user's project

### Requirement: Subsequent updates by Agent
After initial installation, all subsequent code evolution SHALL be performed by the Agent. RavenJS SHALL NOT provide new versions as npm packages.

#### Scenario: Agent evolves code over time
- **WHEN** the user's project needs changes
- **THEN** the Agent SHALL modify the RavenJS code directly in the user's project
