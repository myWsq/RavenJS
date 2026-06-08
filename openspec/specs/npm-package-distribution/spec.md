# npm-package-distribution Specification

## Purpose

TBD - created by archiving change rewrite-3x-hono-npm. Update Purpose after archive.

## Requirements

### Requirement: @raven.js/core 作为标准 npm 包发布

`@raven.js/core` SHALL 作为标准 npm 包发布，去除 `private: true`。`package.json` SHALL 声明 `exports`、类型声明入口（`types`）、构建产物目录与 `files` 白名单，使其可被任意 Node/Bun/Deno 项目安装并 `import`。

#### Scenario: 安装并导入

- **WHEN** 用户在项目中执行包管理器安装 `@raven.js/core`
- **THEN** 用户 SHALL 能 `import { Raven, defineContract, ... } from "@raven.js/core"`
- **AND** 类型声明 SHALL 随包一同提供

#### Scenario: 不再 vendoring 源码

- **WHEN** 用户接入 RavenJS
- **THEN** 框架源码 SHALL NOT 被拷贝进用户项目
- **AND** 框架 SHALL 仅以已发布的 npm 包形式被依赖

### Requirement: 构建产物与导出约定

`@raven.js/core` SHALL 提供构建步骤，产出可发布的 JS 与 `.d.ts`。`exports` SHALL 覆盖公共入口（至少 `.`），并与 `index.ts` 的导出面保持一致。源码内部的相对 import SHALL 在构建中被正确解析（不依赖运行时 `.ts` 扩展名解析）。

#### Scenario: 构建生成产物

- **WHEN** 运行包的 build 脚本
- **THEN** SHALL 生成 JS 产物与对应类型声明
- **AND** `files` 白名单 SHALL 仅包含产物与必要文档

#### Scenario: 导出面一致

- **WHEN** 消费方从包入口导入公共 API
- **THEN** 可导入的符号 SHALL 与 `index.ts` 声明的导出一致

### Requirement: hono 作为 peer dependency

`@raven.js/core` SHALL 将 `hono` 声明为 `peerDependencies`，由用户项目提供，以避免重复实例与版本冲突。

#### Scenario: peer 依赖声明

- **WHEN** 检查 `@raven.js/core` 的 `package.json`
- **THEN** `hono` SHALL 出现在 `peerDependencies`
- **AND** SHALL NOT 被打包进发布产物

### Requirement: 退役 vendoring 分发机制

RavenJS SHALL 退役一切 vendoring 形态的分发机制，包括 `@raven.js/cli`、`install-raven`、`raven sync`、embedded source、smart code update 与 module guide registry。这些包 SHALL NOT 继续发布。

#### Scenario: CLI 与安装器不再发布

- **WHEN** 进行 3.x 发布
- **THEN** `@raven.js/cli` 与 `install-raven` SHALL NOT 被发布
- **AND** 文档 SHALL NOT 引导用户使用 `bunx install-raven` / `raven sync`

**Reason**: 改为标准 npm 包分发后，vendoring、源码同步与离线内嵌机制不再需要。
**Migration**: 用户改为安装 `@raven.js/core` npm 包并安装 peer `hono`；不再有 CLI 安装/同步步骤。
