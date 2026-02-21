## Context

The @ravenjs/cli package has an existing binary release workflow via GitHub Actions (from `add-github-actions-binary-release` change). Binaries are released with naming convention `raven-{version}-{os}-{arch}[.exe]` for:
- linux-x64
- linux-arm64
- darwin-x64
- darwin-arm64
- windows-x64

Users currently need to manually identify their system, go to GitHub Releases, download the correct binary, and install it. This design creates install scripts to automate this process.

## Goals / Non-Goals

**Goals:**
- Create shell script (install.sh) for Linux/macOS
- Create PowerShell script (install.ps1) for Windows
- Automatically detect OS and architecture
- Download latest or specified version from GitHub Releases
- Install to standard locations
- Handle errors gracefully
- Follow industry CLI best practices

**Non-Goals:**
- Package manager integration (Homebrew, apt, etc.) - future consideration
- Auto-update mechanism - future consideration
- Code signing/notarization - existing binary release handles this
- Support for Windows ARM64 - not currently built in release workflow

## Decisions

### 1. Script Types
**Decision:** Provide two scripts: shell (bash/sh) for Unix-like systems and PowerShell for Windows.

**Rationale:**
- Shell script is standard for Linux/macOS CLI installation
- PowerShell is the modern scripting language for Windows
- Covers all platforms supported by binary releases
- Consistent with industry practices (e.g., Deno, Bun, Rust install scripts)

**Alternatives considered:**
- Single cross-platform script (e.g., Node.js) - requires runtime, adds friction
- Only shell script - Windows users would need WSL, not ideal

### 2. Installation Locations
**Decision:**
- Unix-like: `~/.local/bin/raven`
- Windows: `%LOCALAPPDATA%\raven\raven.exe`

**Rationale:**
- `~/.local/bin` is standard for user-installed binaries on Linux/macOS
- `%LOCALAPPDATA%` is standard for per-user app data on Windows
- Doesn't require sudo/admin privileges
- Easy to add to PATH

**Alternatives considered:**
- `/usr/local/bin` - requires sudo, more invasive
- Project-specific directory - less discoverable

### 3. Version Selection
**Decision:** Support both latest version (default) and specific version via flag.

**Rationale:**
- Users usually want the latest version
- Specific version useful for reproducibility or compatibility
- Consistent with industry practices

**Alternatives considered:**
- Only latest - not flexible enough
- Only specific - inconvenient for most users

### 4. Download Source
**Decision:** Download from GitHub Releases API/Assets.

**Rationale:**
- Binaries are already published there via existing workflow
- GitHub Releases is reliable and widely used
- Easy to fetch latest release via API

**Alternatives considered:**
- Custom CDN - adds infrastructure complexity
- NPM registry - not ideal for binary distribution

### 5. Error Handling
**Decision:** Comprehensive error checking with user-friendly messages.

**Rationale:**
- Installation should fail gracefully with clear feedback
- Handle common errors: network issues, unsupported OS/arch, permission issues
- Clean up partial downloads

**Alternatives considered:**
- Minimal error handling - poor user experience

## Risks / Trade-offs

**Risk: Scripts may not work on all shell/PowerShell versions** → Mitigation: Test on common versions; keep scripts simple and compatible

**Risk: Users may not have download tools installed** → Mitigation: Shell script supports both curl and wget; PowerShell uses built-in Invoke-WebRequest

**Risk: Installation location not in PATH** → Mitigation: Provide instructions to add to PATH after installation

**Trade-off: No sudo/admin installation** → Users who want system-wide install need to do it manually; prioritizes user safety and simplicity
