## MODIFIED Requirements

### Requirement: README.md for CLI Tools

CLI tools that copy packages (such as `raven install`) MUST also copy the `README.md` file to the destination.

#### Scenario: CLI copies package

- **WHEN** CLI command copies a package to user directory
- **THEN** the `README.md` file MUST be included in the copy
- **AND** SKILL.md references should point to the copied README
