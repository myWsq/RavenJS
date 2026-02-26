# Remove JTD Validator

## Purpose

This spec tracks the requirement that the JTD Validator module has been removed from the system.

## Requirements

### Requirement: JTD Validator Removal

The system SHALL NOT contain the `jtd-validator` module source code or documentation.

#### Scenario: Module directory does not exist

- **WHEN** the project is inspected
- **THEN** `modules/jtd-validator/` directory SHALL NOT exist

#### Scenario: Documentation removed

- **WHEN** the project is inspected
- **THEN** no documentation files SHALL reference `jtd-validator` as an available module
