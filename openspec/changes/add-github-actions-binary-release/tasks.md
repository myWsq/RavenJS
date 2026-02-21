## 1. GitHub Actions Workflow Setup

- [x] 1.1 Create `.github/workflows/` directory structure
- [x] 1.2 Create `release-cli.yml` workflow file with trigger configuration for `@ravenjs/cli@v*.*.*` tags

## 2. Build Matrix Configuration

- [x] 2.1 Configure build matrix for Linux (x64, ARM64) using GitHub runners
- [x] 2.2 Configure build matrix for macOS (x64, ARM64) using GitHub runners
- [x] 2.3 Configure build matrix for Windows (x64) using GitHub runners

## 3. Binary Build Process

- [x] 3.1 Set up Bun installation in workflow
- [x] 3.2 Configure `bun build --compile --minify` command for each platform
- [x] 3.3 Implement binary naming convention `raven-{version}-{os}-{arch}[.exe]`
- [x] 3.4 Extract version from package-scoped git tag (e.g., `@ravenjs/cli@v1.0.0` → `1.0.0`)

## 4. Release Creation

- [x] 4.1 Configure `softprops/action-gh-release` action
- [x] 4.2 Set up release asset upload for all platform binaries
- [x] 4.3 Configure release title with version number
- [x] 4.4 Add auto-generated release notes from commits

## 5. Verification

- [x] 5.1 Test workflow syntax validation
- [x] 5.2 Verify binary builds complete successfully
- [x] 5.3 Verify release creation with all assets
