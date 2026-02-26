## Context

The @ravenjs/cli package currently has a manual build process using `bun build --compile`. The project uses Bun as its runtime and build tool, with TypeScript. The CLI is a single-file application that can be compiled into a standalone binary using Bun's native compilation feature.

This is a monorepo with multiple packages under `packages/`:

- `@ravenjs/cli` - CLI tool (requires binary release)
- `@ravenjs/core` - Core framework
- `@ravenjs/jtd-validator` - JTD validation plugin
- `@ravenjs/testing` - Testing utilities

Each package may need independent release cycles, so the release workflow must support package-scoped triggers.

Current state:

- Build command: `bun build ./index.ts --compile --minify --outfile raven`
- No automated release process
- No cross-platform build support
- Manual version management

## Goals / Non-Goals

**Goals:**

- Automate binary builds for Linux, macOS, and Windows
- Support both x64 and ARM64 architectures
- Support monorepo package-scoped release triggers (e.g., `@ravenjs/cli@v1.0.0`)
- Generate GitHub Releases with downloadable binaries
- Follow industry best practices for CLI tool distribution
- Enable independent release cycles for each monorepo package

**Non-Goals:**

- Homebrew formula generation (future consideration)
- NPM package publishing (separate workflow)
- Nightly/beta releases (can be added later)
- Code signing and notarization (future consideration)

## Decisions

### 1. Build Tool: Bun Compile

**Decision:** Use Bun's built-in `bun build --compile` for binary generation.

**Rationale:**

- Native support in the project's toolchain
- Single-file output with no external dependencies
- Cross-platform support via GitHub Actions runners
- Faster than pkg or nexe for Bun-based projects

**Alternatives considered:**

- `pkg`: Requires Node.js runtime, larger binaries
- `nexe`: Slower compilation, less maintained
- `sea` (Node.js): More complex setup, requires Node.js 20+

### 2. Platform Support Matrix

**Decision:** Build for 4 target configurations:

- linux-x64
- linux-arm64
- darwin-x64 (macOS Intel)
- darwin-arm64 (macOS Apple Silicon)
- windows-x64

**Rationale:**

- Covers 95%+ of developer workstations
- GitHub Actions provides native runners for all targets
- Windows ARM64 support is limited, skip for now

### 3. Release Trigger Strategy (Monorepo Support)

**Decision:** Trigger on package-scoped version tags matching `@ravenjs/cli@v*.*.*` pattern.

**Rationale:**

- Monorepo-friendly: Each package can have independent release cycles
- Package-scoped tags prevent conflicts (e.g., `@ravenjs/cli@v1.0.0`, `@ravenjs/core@v2.0.0`)
- Semantic versioning is preserved
- Explicit control over release timing
- Prevents accidental releases from branch pushes
- Easy to create releases via `git tag @ravenjs/cli@v1.0.0 && git push --tags`

**Alternatives considered:**

- Simple `v*.*.*`: Doesn't work for monorepo with multiple packages
- `cli-v*.*.*`: Less standard, harder to parse
- `@ravenjs/cli-v*.*.*`: Missing the `@` before version which is the standard format used by changesets

### 4. Release Action

**Decision:** Use `softprops/action-gh-release` for release creation.

**Rationale:**

- Most popular and well-maintained release action
- Automatic asset upload
- Supports release notes generation
- Handles existing releases gracefully

**Alternatives considered:**

- `actions/create-release`: Deprecated, unmaintained
- `gh release create`: Requires more setup in workflow

### 5. Binary Naming Convention

**Decision:** Use format `raven-{version}-{os}-{arch}[.exe]`

**Rationale:**

- Clear identification of version, OS, and architecture
- Consistent with industry tools (e.g., `node-v20.0.0-darwin-x64`)
- `.exe` extension for Windows is expected by users

## Risks / Trade-offs

**Risk: Large binary size** → Mitigation: Use `--minify` flag; Bun produces reasonably sized binaries (~50-80MB)

**Risk: No code signing on macOS** → Mitigation: Document workaround (xattr -cr); plan for future signing

**Risk: Windows Defender false positives** → Mitigation: Common for unsigned binaries; consider signing in future

**Risk: Bun version compatibility** → Mitigation: Pin Bun version in workflow; test builds before release

**Trade-off: No auto-update mechanism** → Users must manually download new versions; consider implementing self-update in future
