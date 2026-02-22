## 1. CLI Command Rename

- [x] 1.1 Rename `init` subcommand to `install` in `packages/cli/index.ts`
- [x] 1.2 Rename `cmdInit` to `cmdInstall` and update success message to "RavenJS installed successfully!"
- [x] 1.3 Update error messages in add/update: "Run 'raven init' first" → "Run 'raven install' first"
- [x] 1.4 Update "already initialized" → "already installed" in cmdInstall

## 2. E2E Tests

- [x] 2.1 Change all `runCli(["init", ...])` to `runCli(["install", ...])` in `tests/e2e/cli.test.ts`
- [x] 2.2 Update "Init Command" describe block to "Install Command"
- [x] 2.3 Update assertions: "RavenJS initialized successfully" → "RavenJS installed successfully"
- [x] 2.4 Update assertions: "already initialized" → "already installed", "not initialized" → "not installed"
- [x] 2.5 Update "Initializing RavenJS" verbose output checks to "Installing RavenJS"
- [x] 2.6 Update Global Options test: "init" → "install"

## 3. Main Specs

- [x] 3.1 Update `openspec/specs/cli-tool/spec.md`: init → install (requirement and scenarios)
- [x] 3.2 Update `openspec/specs/registry-based-install/spec.md`: raven init → raven install
- [x] 3.3 Update `openspec/specs/cli-output-styling/spec.md`: init → install in examples
- [x] 3.4 Update `openspec/specs/module-documentation/spec.md`: raven init → raven install
