# cli-tool Delta Spec (install-raven)

## MODIFIED Requirements

### Requirement: raven update Command

The system SHALL update installed RavenJS modules when `raven update` is executed. The system SHALL NOT install or update AI resources (skills); skill installation and updates are handled by the install-raven CLI.

#### Scenario: raven update updates framework modules

- **WHEN** user runs `raven update`
- **THEN** all installed modules in `raven/` are updated
- **AND** `raven.yaml` is updated with latest version

#### Scenario: raven update when .claude exists

- **WHEN** user runs `raven update` AND `.claude/` exists
- **THEN** only framework modules in `raven/` are updated
- **AND** NO files in `.claude/skills/` are modified by the CLI

#### Scenario: raven update when AI resources not installed

- **WHEN** user runs `raven update` AND `.claude/` does NOT exist
- **THEN** only framework modules are updated
- **AND** no error is raised about missing AI resources

#### Scenario: raven update shows progress

- **WHEN** user runs `raven update`
- **THEN** progress indicator shows framework module updates
- **AND** final summary lists modified files (framework only)

### Requirement: raven init Command

The system SHALL provide a `raven init` command that initializes the raven root directory (creates directory and `raven.yaml`). The command SHALL NOT install AI resources to `.claude/`; the command SHALL NOT install the core module. When re-run, if raven root already exists with `raven.yaml`, the root SHALL NOT be modified.

#### Scenario: raven init in fresh directory creates root only

- **WHEN** user runs `raven init` in a directory with no raven installation
- **THEN** `<root>/` directory is created
- **AND** `<root>/raven.yaml` is created with version from registry
- **AND** core module is NOT installed
- **AND** `.claude/skills/` is NOT created or populated by the CLI

#### Scenario: raven init idempotent when root already exists

- **WHEN** user runs `raven init` AND raven root directory exists AND `raven.yaml` exists
- **THEN** raven root directory and `raven.yaml` are NOT modified
- **AND** the command exits successfully without writing to `.claude/`

#### Scenario: raven init shows progress

- **WHEN** user runs `raven init` without `--verbose`
- **THEN** a spinner is displayed during initialization
- **AND** completion message shows created or modified files

#### Scenario: raven init verbose output

- **WHEN** user runs `raven init --verbose`
- **THEN** detailed progress is logged to console
- **AND** no spinner is displayed

#### Scenario: raven init creates directory structure

- **WHEN** `raven init` runs
- **THEN** `<root>/` and `raven.yaml` are created if missing
- **AND** `.claude/skills/` is NOT created by the CLI
- **AND** `.claude/commands/` directory is NOT created (commands are deprecated)

### Requirement: raven init Command Options

The system SHALL support standard CLI options for `raven init`. The option for loading AI resources from a local path (e.g. `--source`) is removed; AI resource installation is handled by install-raven.

#### Scenario: raven init supports --verbose

- **WHEN** user runs `raven init --verbose` or `-v`
- **THEN** verbose output is enabled

### Requirement: Loading spinners for async operations

The CLI SHALL show a loading spinner during long-running operations (init, add, update).

#### Scenario: init shows spinner during initialization

- **WHEN** user runs `raven init`
- **THEN** a spinner is shown while the raven root and `raven.yaml` are being created

#### Scenario: add shows spinner during module download

- **WHEN** user runs `raven add <module>`
- **THEN** a spinner is shown while the module is being downloaded

#### Scenario: update shows spinner during update

- **WHEN** user runs `raven update`
- **THEN** a spinner is shown during the update process

### Requirement: Registry-Based Module Installation

The system SHALL provide a mechanism to install RavenJS modules from a registry that describes module files, external dependencies, and module dependencies (dependsOn). Core is a module like others; it is installed via `raven add core` after `raven init`.

#### Scenario: Initialize new project

- **WHEN** user runs `raven init` in a directory
- **THEN** the system creates `<root>/` directory and `raven.yaml` with version from registry
- **AND** core is NOT installed (user runs `raven add core` separately)
- **AND** the CLI does NOT copy AI resources to `.claude/skills/` (use install-raven for that)

#### Scenario: Add module to existing project

- **WHEN** user runs `raven add <module-name>` with a valid module name
- **THEN** the system installs any uninstalled dependsOn modules first
- **AND** downloads module files to `raven/<module-name>/`
- **AND** replaces `@ravenjs/*` imports with relative paths in copied files
- **AND** installs external npm dependencies if any

#### Scenario: Module not found

- **WHEN** user runs `raven add <invalid-module>`
- **THEN** the system displays an error with available modules list

### Requirement: AI Resource Registry

The registry MAY maintain an `ai` property for use by other tools (e.g. install-raven). The @raven.js/cli SHALL NOT use the registry's `ai` property when running `raven init` or `raven update`; the CLI SHALL NOT install or update AI resources.

#### Scenario: CLI does not install from registry ai

- **WHEN** user runs `raven init` or `raven update`
- **THEN** the CLI does NOT read or use the registry's `ai` property to copy or update files under `.claude/skills/`

## REMOVED Requirements

### Requirement: AI Skills Installation

**Reason:** Skill installation is handled by the dedicated install-raven CLI. The main CLI no longer writes to `.claude/skills/`.

**Migration:** To install AI skills, run `npx install-raven` (or equivalent) before or after `raven init`. Skills will be written to `.claude/skills/` by install-raven.

### Requirement: raven init supports --source (AI resources)

**Reason:** `raven init --source <path>` was used to load AI resources from a local path. Since the CLI no longer installs AI resources, this option is removed.

**Migration:** Use install-raven to install skills; it can be configured to use local or remote sources as needed.
