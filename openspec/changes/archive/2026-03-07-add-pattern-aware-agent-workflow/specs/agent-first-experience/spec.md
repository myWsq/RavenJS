## MODIFIED Requirements

### Requirement: RavenJS as Agent Teaching Tool

RavenJS SHALL be positioned as an Agent teaching tool rather than a traditional npm framework. The primary audience SHALL be AI Agents, not human developers directly. The teaching outcome SHALL include not only understanding RavenJS APIs and architecture, but also understanding and applying RavenJS pattern boundaries when generating or updating project code.

#### Scenario: Agent learns from RavenJS

- **WHEN** an Agent uses raven-learn SKILL
- **THEN** the Agent SHALL understand RavenJS's design philosophy, architecture, and pattern entrypoints
- **AND** the Agent SHALL know which documents to read for business layering versus runtime assembly

#### Scenario: Agent generates code based on teaching

- **WHEN** an Agent has learned RavenJS
- **THEN** the Agent SHALL be able to write code in RavenJS's style without requiring the framework as a dependency
- **AND** the Agent SHALL organize new code according to RavenJS pattern instead of only imitating API usage

#### Scenario: Agent updates existing RavenJS code

- **WHEN** an Agent evolves an existing RavenJS project after learning the framework
- **THEN** the Agent SHALL preserve or improve pattern boundaries during the update
- **AND** the Agent SHALL avoid introducing documented anti-patterns as part of the change
