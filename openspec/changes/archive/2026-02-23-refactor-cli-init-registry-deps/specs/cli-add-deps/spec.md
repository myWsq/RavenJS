# CLI Add Dependencies

## ADDED Requirements

### Requirement: raven add installs module dependencies first

When adding a module, the system SHALL check the module's dependsOn in the registry. If any dependency module is not installed, the system SHALL install it before installing the requested module. Dependencies SHALL be installed in topological order (dependencies before dependents).

#### Scenario: add installs dependency when missing

- **WHEN** user runs `raven add jtd-validator` AND core is NOT installed
- **THEN** core is installed first
- **AND** then jtd-validator is installed
- **AND** output reflects both modules installed

#### Scenario: add skips dependency when already installed

- **WHEN** user runs `raven add jtd-validator` AND core is already installed
- **THEN** only jtd-validator is installed
- **AND** core is not re-downloaded

#### Scenario: add transitive dependencies

- **WHEN** a module A depends on B and B depends on C, and user runs `raven add A` with neither B nor C installed
- **THEN** C is installed first, then B, then A
- **AND** installation order respects dependency graph

#### Scenario: add fails on circular dependency

- **WHEN** registry contains a circular dependency (A→B→A)
- **AND** user runs `raven add A` or `raven add B`
- **THEN** CLI SHALL exit with an error describing the cycle
- **AND** no partial installation occurs

#### Scenario: add requires raven root to exist

- **WHEN** user runs `raven add <module>` and raven root directory does NOT exist
- **THEN** CLI SHALL exit with an error instructing user to run `raven init` first

### Requirement: raven add replaces @ravenjs/* imports with relative paths

When copying module files to the user's project, the system SHALL replace `@ravenjs/<module>` import paths with the correct relative path (e.g., `../core`) before writing. The user's raven root has no package.json; modules are plain folders, so `@ravenjs/core` SHALL NOT resolve. The replacement ensures imports work after copy.

#### Scenario: jtd-validator imports resolve to relative path

- **WHEN** CLI copies jtd-validator files and main.ts contains `from "@ravenjs/core"`
- **THEN** the written file contains `from "../core"` (or equivalent relative path)
- **AND** the import resolves correctly in the user's project

#### Scenario: replacement handles single and double quotes

- **WHEN** source has `from '@ravenjs/core'` or `from "@ravenjs/core"`
- **THEN** both forms are replaced with the correct relative path

#### Scenario: replacement only for registry modules

- **WHEN** source imports `@ravenjs/other` and "other" exists in registry.modules
- **THEN** the import is replaced with the relative path to that module
