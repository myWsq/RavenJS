## REMOVED Requirements

### Requirement: Registry AI Agent-Based Structure

**Reason**: `registry.json` 不再包含 `ai` 字段。registry 的职责仅为描述可安装的代码模块（`version` + `modules`），AI 资源管理由 `install-raven` 单独负责。

**Migration**: 如需获取 AI agent 资源映射，请直接读取 `packages/ai/package.json` 中的 `claude` 字段，而非通过 registry.json。

### Requirement: AI Resource Registry

**Reason**: Registry 不再维护 `ai` 属性。`@raven.js/cli` 不读取也不使用 registry 的 `ai` 字段，该职责完全移交给 `install-raven`。

**Migration**: `install-raven` 工具应直接从 `packages/ai/package.json` 读取 agent 映射配置。

### Requirement: Parallel File Download

**Reason**: CLI 不再从网络下载模块文件，而是从构建时内嵌的 `dist/source/` 读取，"下载"概念不再适用。

**Migration**: 参见新能力 `cli-embedded-source`。

## ADDED Requirements

### Requirement: Parallel File Copy from Embedded Source

CLI SHALL 在安装模块时并发地从内嵌 `dist/source/` 目录复制多个文件，以保持安装性能。

#### Scenario: Copy multiple files concurrently

- **WHEN** 系统需要为一个模块安装 10 个文件
- **THEN** 系统 SHALL 并发复制文件（而非顺序逐一）

#### Scenario: Copy failure

- **WHEN** 任何文件在 `dist/source/` 中不存在
- **THEN** 系统报错显示缺失的文件路径
- **AND** 系统不留下不完整的安装文件

## MODIFIED Requirements

### Requirement: add 命令添加功能模块

`raven add <module>` SHALL copy the specified module's code to the project from the embedded source (`dist/source/<module>/`). Before installing the target module, the system SHALL install any uninstalled dependencies listed in the registry's dependsOn for that module. Dependencies SHALL be installed in topological order. When copying module files, the system SHALL replace `@ravenjs/<module>` import paths with the correct relative path (e.g., `../core`) before writing.

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

### Requirement: Registry-Based Module Installation

The system SHALL provide a mechanism to install RavenJS modules from a registry that describes module files, external dependencies, and module dependencies (dependsOn). Core is a module like others; it is installed via `raven add core` after `raven init`. Module files are read from the embedded source directory (`dist/source/`) rather than downloaded from a network source.

#### Scenario: Initialize new project

- **WHEN** user runs `raven init` in a directory
- **THEN** the system creates `<root>/` directory and `raven.yaml` with version from registry
- **AND** core is NOT installed (user runs `raven add core` separately)
- **AND** the CLI does NOT copy AI resources to `.claude/skills/` (use install-raven for that)

#### Scenario: Add module to existing project

- **WHEN** user runs `raven add <module-name>` with a valid module name
- **THEN** the system installs any uninstalled dependsOn modules first
- **AND** copies module files from `dist/source/<module-name>/` to `raven/<module-name>/`
- **AND** replaces `@ravenjs/*` imports with relative paths in copied files
- **AND** installs external npm dependencies if any

#### Scenario: Module not found

- **WHEN** user runs `raven add <invalid-module>`
- **THEN** the system displays an error with available modules list
