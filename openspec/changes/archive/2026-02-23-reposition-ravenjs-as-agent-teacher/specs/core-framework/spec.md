## MODIFIED Requirements

### Requirement: RavenJS as Agent Teaching Tool

RavenJS SHALL be positioned as an Agent teaching tool rather than a traditional npm framework. The framework code SHALL be provided as reference implementation for Agents to learn from, not as a dependency to import.

#### Scenario: Agent learns from RavenJS code

- **WHEN** an Agent reads the RavenJS reference code and README.md
- **THEN** the Agent SHALL understand how to write code in RavenJS's style
- **AND** the Agent SHALL be able to generate similar code without requiring RavenJS as a dependency

### Requirement: Only README.md provided for documentation

RavenJS SHALL only provide a README.md file for each module. No additional documentation files (DESIGN.md, CHANGELOG.md, TEACHING.md, etc.) SHALL be created.

#### Scenario: Module documentation structure

- **WHEN** an Agent looks at a RavenJS module
- **THEN** only README.md SHALL exist

### Requirement: README.md structured for Agent learning

The README.md SHALL be structured specifically for Agent learning, with clear sections explaining design intent and architecture.

#### Scenario: README.md contains learning sections

- **WHEN** an Agent reads README.md
- **THEN** the README SHALL contain these sections: OVERVIEW, HOW TO READ THIS CODE, CORE CONCEPTS, ARCHITECTURE, DESIGN DECISIONS, KEY CODE LOCATIONS, EXTENSION POINTS, USAGE EXAMPLES

### Requirement: No Changelog maintained

RavenJS SHALL NOT maintain a Changelog file. Change tracking SHALL be left to git history and Agent analysis.

#### Scenario: No Changelog file exists

- **WHEN** an Agent looks for Changelog
- **THEN** no Changelog file SHALL exist
