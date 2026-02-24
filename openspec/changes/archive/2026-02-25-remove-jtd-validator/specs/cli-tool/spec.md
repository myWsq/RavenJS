## MODIFIED Requirements

### Requirement: add 命令添加功能模块

`raven add <module>` SHALL copy the specified module's code to the project. Before installing the target module, the system SHALL install any uninstalled dependencies listed in the registry's dependsOn for that module. Dependencies SHALL be installed in topological order. When copying module files, the system SHALL replace `@ravenjs/<module>` import paths with the correct relative path (e.g., `../core`) before writing.

#### Scenario: 添加 core 模块

- **WHEN** user runs `raven add core`
- **THEN** core module is installed to `<root>/core/`
- **AND** skill can use this command to install RavenJS core

#### Scenario: 添加不存在的功能

- **WHEN** user runs `raven add <不存在的功能>`
- **THEN** CLI displays error with available modules list

#### Scenario: add 需先 init

- **WHEN** user runs `raven add <module>` and raven root directory does NOT exist
- **THEN** CLI SHALL exit with an error instructing user to run `raven init` first

#### Scenario: add 循环依赖报错

- **WHEN** registry contains a circular dependency (A→B→A) and user runs `raven add A` or `raven add B`
- **THEN** CLI SHALL exit with an error describing the cycle

### Requirement: raven status Command

The system SHALL provide a `raven status` command that reports installation status for all registry modules. Each module SHALL have an `installed` field. Core SHALL be treated as a regular module (no separate top-level core field).

#### Scenario: raven status shows all modules with installed flag

- **WHEN** user runs `raven status`
- **THEN** output lists every module in the registry
- **AND** each module has `installed: true` or `installed: false` based on whether the module directory exists with content
- **AND** modules are ordered consistently (e.g., alphabetically by name)

#### Scenario: raven status supports --json

- **WHEN** user runs `raven status --json`
- **THEN** output is valid JSON with `modules` array containing `{ name, installed }` per module
- **AND** no top-level `core` object; core appears in modules

#### Scenario: raven status respects --root

- **WHEN** user runs `raven status --root <dir>` or RAVEN_ROOT is set
- **THEN** status is checked relative to `<cwd>/<dir>/`

#### Scenario: raven status exits 0 when nothing installed

- **WHEN** user runs `raven status` in a project with no RavenJS installation
- **THEN** exit code is 0
- **AND** all modules show installed: false
