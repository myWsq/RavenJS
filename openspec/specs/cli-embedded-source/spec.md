# CLI Embedded Source Specification

## Purpose

定义 CLI 构建时内嵌模块源码、运行时从内嵌路径读取的能力，使 CLI 离线可用，无需运行时网络访问。

## Requirements

### Requirement: Build embeds module source into dist

构建脚本 SHALL 在生成 CLI 二进制时，将所有 git-tracked 模块文件（`modules/<name>/` 下，排除 `package.json`）复制到 `dist/source/<name>/` 目录，以便 CLI 运行时无需网络访问即可读取模块文件。

#### Scenario: Build produces dist/source directory

- **WHEN** `bun run build` 执行完成
- **THEN** `dist/source/` 目录存在
- **AND** 每个在 `modules/` 下的模块都在 `dist/source/<module-name>/` 中有对应文件
- **AND** 文件内容与 `modules/<module-name>/` 下的源文件一致

#### Scenario: Only git-tracked files are embedded

- **WHEN** 构建脚本扫描模块文件
- **THEN** 仅复制 git-tracked 的文件（`git ls-files` 能列出的文件）
- **AND** `package.json` 文件不被复制到 `dist/source/`

### Requirement: CLI reads modules from embedded source

CLI SHALL 从 `join(__dirname, "source", moduleName, file)` 路径读取模块文件，而不是通过网络从 GitHub 下载。

#### Scenario: Module install reads from embedded source

- **WHEN** 用户运行 `raven add <module>`
- **THEN** CLI 从 `dist/source/<module>/` 读取文件内容
- **AND** 不发起任何 HTTP 请求到 GitHub

#### Scenario: Module install fails if embedded source missing

- **WHEN** `dist/source/<module>/<file>` 不存在
- **THEN** CLI 报错并提示文件缺失
- **AND** 不尝试网络下载作为 fallback
