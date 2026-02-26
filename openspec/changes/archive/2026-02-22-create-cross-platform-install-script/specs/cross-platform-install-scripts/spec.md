## ADDED Requirements

### Requirement: Shell script for Unix-like systems

The system SHALL provide a shell script (install.sh) that works on Linux and macOS.

#### Scenario: Shell script runs on Linux

- **WHEN** user runs install.sh on Linux
- **THEN** the script SHALL execute without errors

#### Scenario: Shell script runs on macOS

- **WHEN** user runs install.sh on macOS
- **THEN** the script SHALL execute without errors

### Requirement: PowerShell script for Windows

The system SHALL provide a PowerShell script (install.ps1) that works on Windows.

#### Scenario: PowerShell script runs on Windows

- **WHEN** user runs install.ps1 on Windows
- **THEN** the script SHALL execute without errors

### Requirement: OS and architecture detection

The install scripts SHALL automatically detect the user's operating system and CPU architecture.

#### Scenario: Detect Linux x64

- **WHEN** script runs on Linux x64
- **THEN** it SHALL identify OS as "linux" and arch as "x64"

#### Scenario: Detect Linux ARM64

- **WHEN** script runs on Linux ARM64
- **THEN** it SHALL identify OS as "linux" and arch as "arm64"

#### Scenario: Detect macOS Intel

- **WHEN** script runs on macOS Intel
- **THEN** it SHALL identify OS as "darwin" and arch as "x64"

#### Scenario: Detect macOS Apple Silicon

- **WHEN** script runs on macOS Apple Silicon
- **THEN** it SHALL identify OS as "darwin" and arch as "arm64"

#### Scenario: Detect Windows x64

- **WHEN** script runs on Windows x64
- **THEN** it SHALL identify OS as "windows" and arch as "x64"

### Requirement: Download latest version by default

The install scripts SHALL download the latest released version by default.

#### Scenario: Download latest version

- **WHEN** user runs script without version argument
- **THEN** it SHALL download the latest available version from GitHub Releases

### Requirement: Support specific version installation

The install scripts SHALL allow users to specify a particular version to install.

#### Scenario: Install specific version

- **WHEN** user runs script with version argument (e.g., v1.0.0)
- **THEN** it SHALL download and install that exact version

### Requirement: Install to standard location

The install scripts SHALL install the binary to a standard user-specific location.

#### Scenario: Install to ~/.local/bin on Unix

- **WHEN** shell script completes successfully
- **THEN** binary SHALL be installed at ~/.local/bin/raven

#### Scenario: Install to %LOCALAPPDATA%\raven on Windows

- **WHEN** PowerShell script completes successfully
- **THEN** binary SHALL be installed at %LOCALAPPDATA%\raven\raven.exe

### Requirement: Binary executable permission

The install scripts SHALL make the binary executable after download.

#### Scenario: Set executable permission on Unix

- **WHEN** shell script installs binary
- **THEN** it SHALL set executable permissions (chmod +x)

### Requirement: Error handling

The install scripts SHALL handle common errors and provide user-friendly messages.

#### Scenario: Unsupported OS

- **WHEN** script runs on unsupported OS
- **THEN** it SHALL display error message and exit with non-zero code

#### Scenario: Unsupported architecture

- **WHEN** script runs on unsupported architecture
- **THEN** it SHALL display error message and exit with non-zero code

#### Scenario: Network failure

- **WHEN** download fails due to network issue
- **THEN** it SHALL display error message and exit with non-zero code

#### Scenario: Permission denied

- **WHEN** script cannot write to install location
- **THEN** it SHALL display error message and exit with non-zero code

### Requirement: Clean up partial downloads

The install scripts SHALL clean up partially downloaded files if installation fails.

#### Scenario: Clean up on failure

- **WHEN** installation fails
- **THEN** it SHALL remove any partially downloaded files
