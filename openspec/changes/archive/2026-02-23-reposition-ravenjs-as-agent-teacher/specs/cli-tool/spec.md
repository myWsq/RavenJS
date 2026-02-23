## MODIFIED Requirements

### Requirement: All CLI outputs in JSON format
All RavenJS CLI commands SHALL output JSON format by default, with the exception of `raven init`.

#### Scenario: CLI command outputs JSON
- **WHEN** an Agent runs any RavenJS CLI command except `raven init`
- **THEN** the output SHALL be valid JSON

#### Scenario: raven init for human use
- **WHEN** a human runs `raven init`
- **THEN** the output SHALL be human-friendly (non-JSON)

### Requirement: CLI provides structured information for Agent
The CLI SHALL provide structured information to help Agents make decisions, including:
- Current version
- Latest available version
- Whether user has modified files
- File hashes

#### Scenario: Agent checks status
- **WHEN** an Agent runs `raven status --json`
- **THEN** the output SHALL include current version, latest version, and modified file status

### Requirement: CLI provides guidance entry points
The CLI SHALL provide entry points for Agents to fetch information, without pre-computing change analysis.

#### Scenario: Agent gets guidance
- **WHEN** an Agent runs `raven guide`
- **THEN** the output SHALL provide basic context and action entry points (fetch, diff, etc.)
