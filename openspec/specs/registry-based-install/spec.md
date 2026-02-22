## ADDED Requirements

### Requirement: Registry-Based Module Installation
The system SHALL provide a mechanism to install RavenJS modules from a registry that describes module files and external dependencies.

#### Scenario: Initialize new project
- **WHEN** user runs `raven init` in an empty directory
- **THEN** system creates a `raven/` directory with version from registry
- **AND** system downloads core module files from GitHub based on registry.json

#### Scenario: Add module to existing project
- **WHEN** user runs `raven add <module-name>` with a valid module name
- **THEN** system downloads module files to `raven/<module-name>/`
- **AND** system installs external dependencies if any

#### Scenario: Module not found
- **WHEN** user runs `raven add <invalid-module>`
- **THEN** system displays error with available modules list

### Requirement: Parallel File Download
The system SHALL download multiple files concurrently when installing modules.

#### Scenario: Download multiple files
- **WHEN** system needs to download 10 files for a module
- **THEN** system SHALL download files in parallel (not sequentially)

#### Scenario: Download failure
- **WHEN** any file download fails
- **THEN** system displays error with failed file URL
- **AND** system does not leave partial files

### Requirement: Configurable Raven Root
The system SHALL allow users to configure the RavenJS root directory.

#### Scenario: Default raven directory
- **WHEN** user runs `raven init` without any options
- **THEN** system creates `raven/` as the default root directory

#### Scenario: Custom raven directory
- **WHEN** user runs `raven init --raven-root custom-dir`
- **THEN** system creates `custom-dir/` as the root directory
