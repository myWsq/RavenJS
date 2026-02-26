# CLI Registry Module Dependencies

## ADDED Requirements

### Requirement: Registry modules include dependsOn for @ravenjs workspace dependencies

The registry SHALL include a `dependsOn` array for each module, listing module names (not package names) that the module depends on. Only @ravenjs/\* workspace dependencies SHALL be included; external npm packages SHALL NOT appear in dependsOn.

#### Scenario: Module with no workspace deps has empty dependsOn

- **WHEN** a module's package.json has no dependencies on @ravenjs/\* packages
- **THEN** its registry entry SHALL have `dependsOn: []`

#### Scenario: Module depending on core has core in dependsOn

- **WHEN** a module's package.json has `"@ravenjs/core": "workspace:*"` in dependencies or devDependencies
- **THEN** its registry entry SHALL have `dependsOn: ["core"]`

#### Scenario: Module depending on multiple workspace packages

- **WHEN** a module depends on both @ravenjs/core and another @ravenjs package
- **THEN** dependsOn SHALL list the corresponding module names (e.g., `["core", "other-module"]`)

### Requirement: generate-registry resolves dependsOn from package.json

The generate-registry script SHALL parse each module's package.json and extract @ravenjs/\* references from both dependencies and devDependencies, then populate dependsOn in the output registry.

#### Scenario: jtd-validator produces dependsOn core

- **WHEN** modules/jtd-validator/package.json contains `"@ravenjs/core": "workspace:*"` in devDependencies
- **THEN** generate-registry produces registry with jtd-validator having `dependsOn: ["core"]`

#### Scenario: Circular dependency detection

- **WHEN** generate-registry detects a circular dependency between modules
- **THEN** the script SHALL exit with an error
- **AND** the error message SHALL identify the cycle
