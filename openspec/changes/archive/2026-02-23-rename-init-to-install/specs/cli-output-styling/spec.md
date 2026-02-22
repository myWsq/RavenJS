## MODIFIED Requirements

### Requirement: Colorized output via a standard colors library

The CLI SHALL use a well-known colors library (e.g., picocolors, chalk, kleur) for all colored output instead of raw ANSI escape codes.

#### Scenario: Success messages are green
- **WHEN** CLI prints a success message (e.g., after install/add/update)
- **THEN** the message is rendered in green

### Requirement: Respect NO_COLOR and non-TTY environments

The CLI SHALL disable colors when `NO_COLOR` is set or when stdout is not a TTY, to avoid ANSI noise in logs and CI.

#### Scenario: Piped/redirected output has no colors
- **WHEN** stdout is not a TTY (e.g., `raven install | cat`)
- **THEN** output is plain text without ANSI codes

### Requirement: Loading spinners for async operations

The CLI SHALL show a loading spinner during long-running operations (install, add, update).

#### Scenario: install shows spinner during download
- **WHEN** user runs `raven install`
- **THEN** a spinner is shown while core files are being downloaded

#### Scenario: add shows spinner during module download
- **WHEN** user runs `raven add <module>`
- **THEN** a spinner is shown while the module is being downloaded

#### Scenario: update shows spinner during update
- **WHEN** user runs `raven update`
- **THEN** a spinner is shown during the update process

### Requirement: Structured output sections

The CLI SHALL output structured sections (e.g., Modified Files, Required Dependencies) with clear headers and consistent formatting.

#### Scenario: Modified files list has a header
- **WHEN** install, add, or update completes successfully
- **THEN** a "Modified Files" section is shown with a clear header
