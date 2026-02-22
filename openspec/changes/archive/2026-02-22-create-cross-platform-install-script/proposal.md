## Why

Currently, users need to manually download the appropriate binary for their system from GitHub Releases, which creates friction. Implementing an install script that automatically detects the user's operating system and architecture and downloads the correct binary follows industry CLI best practices and simplifies the installation process.

## What Changes

- Create a shell install script for Unix-like systems (Linux, macOS)
- Create a PowerShell install script for Windows
- Scripts shall detect OS, architecture, and download the latest or specified version
- Scripts shall install the binary to a standard location (e.g., ~/.local/bin, %LOCALAPPDATA%\raven)
- Scripts shall handle errors gracefully and provide user feedback
- Follow industry best practices (e.g., curl/wget for shell, Invoke-WebRequest for PowerShell)

## Capabilities

### New Capabilities

- `cross-platform-install-scripts`: Shell and PowerShell install scripts that automatically detect user's system and download the appropriate binary

### Modified Capabilities

None - This is a new capability that does not modify existing spec-level behavior.

## Impact

- **New Files**: `install.sh` (shell script), `install.ps1` (PowerShell script) in repository root
- **Documentation**: May need to update README with installation instructions
- **Release Process**: No changes needed - builds on existing binary release workflow
