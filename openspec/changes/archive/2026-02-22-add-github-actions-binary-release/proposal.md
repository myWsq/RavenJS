## Why

Currently, @ravenjs/cli lacks an automated release pipeline. Users must manually build and distribute the CLI binary, which creates friction for adoption and makes version management difficult. Implementing GitHub Actions for automated binary builds and releases follows industry best practices and enables seamless distribution across multiple platforms.

## What Changes

- Add GitHub Actions workflow for automated CI/CD pipeline
- Build cross-platform binary executables (Linux, macOS, Windows) for x64 and ARM64 architectures
- Automate release creation with semantic versioning support
- Support monorepo package-scoped release triggers (e.g., `@ravenjs/cli@v1.0.0`)
- Generate release notes automatically from commit history
- Upload compiled binaries as release assets with proper naming conventions

## Capabilities

### New Capabilities

- `binary-release-workflow`: GitHub Actions workflow for building and releasing CLI binaries across multiple platforms with automated versioning and release management

### Modified Capabilities

None - This is a new infrastructure capability that does not modify existing spec-level behavior.

## Impact

- **New Files**: `.github/workflows/release-cli.yml` - GitHub Actions workflow configuration for CLI package
- **Affected Package**: `packages/cli` - Build configuration may need adjustments for cross-platform compilation
- **Dependencies**: No new runtime dependencies; uses Bun's built-in compile feature
- **Release Process**: Automated via GitHub releases when package-scoped version tags are pushed (e.g., `@ravenjs/cli@v1.0.0`)
