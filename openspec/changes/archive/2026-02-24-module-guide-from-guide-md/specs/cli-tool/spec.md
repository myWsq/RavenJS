# CLI Tool Specification (Delta)

## MODIFIED Requirements

### Requirement: CLI provides guidance entry points

The CLI SHALL provide entry points for Agents to fetch information, without pre-computing change analysis.

#### Scenario: Agent gets guidance

- **WHEN** an Agent runs `raven guide <module>`
- **THEN** the output SHALL be the contents of `GUIDE.md` from the installed module directory (`<root>/<module>/GUIDE.md`)
- **AND** the content SHALL be output as plain text (not wrapped in XML or JSON)

#### Scenario: guide 命令在模块缺少 GUIDE.md 时报错

- **WHEN** an Agent runs `raven guide <module>`
- **AND** the module is installed but `<root>/<module>/GUIDE.md` does not exist
- **THEN** the CLI SHALL exit with an error message
- **AND** no guide content SHALL be output
