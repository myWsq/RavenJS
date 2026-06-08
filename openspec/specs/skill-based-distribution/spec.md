# skill-based-distribution Specification

## Purpose

TBD - created by archiving change rewrite-3x-hono-npm. Update Purpose after archive.

## Requirements

### Requirement: 框架知识以仓库内 skill 承载

RavenJS 的分层方法论、API 教学与 AI-native 定位 SHALL 全部以 skill 形态承载，置于本仓库内。skill SHALL 面向 AI Agent，教其使用已发布的 `@raven.js/core` npm 包 API 与分层写法，而非管理 vendored 源码。

#### Scenario: skill 教学 npm 包 API

- **WHEN** Agent 加载 RavenJS skill 编写应用代码
- **THEN** skill SHALL 指导从 `@raven.js/core` 导入并使用公共 API
- **AND** SHALL NOT 包含拷贝/同步框架源码的指令

#### Scenario: 分层方法论以 skill 表达

- **WHEN** Agent 处理业务代码组织（interface/entity/repository 等）
- **THEN** 对应 skill SHALL 提供分层判断与 pattern 自检指引
- **AND** 该方法论 SHALL NOT 依赖 vendoring 形态的 pattern 文档分发

### Requirement: skill 仅置于仓库、RavenJS 不自建安装器

skill 文件 SHALL 仅存放于本仓库（不进入 `@raven.js/core` npm 包的分发物）。RavenJS SHALL NOT 提供任何自建的 skill 安装器（不提供 `install-raven` 或等价 CLI、可执行包或脚本）。文档 MAY 推荐通用第三方 skills CLI（如 [vercel-labs/skills](https://github.com/vercel-labs/skills)）直接从本仓库拉取 skill，并 SHALL 同时保留手动拷贝作为备选路径。

#### Scenario: 文档推荐通用 CLI 或手动拷贝

- **WHEN** 用户希望在自己项目中使用 RavenJS skill
- **THEN** 文档 SHALL 说明用通用第三方 skills CLI 从仓库安装（`npx skills add <repo>`）
- **AND** SHALL 保留从仓库手动拷贝 skill 到目标 skill 目录的备选说明

#### Scenario: RavenJS 不自建安装器

- **WHEN** 检查 3.x 的分发物
- **THEN** SHALL NOT 包含任何 RavenJS 自建的、用于安装 skill 的可执行包或脚本
- **AND** skill 文件 SHALL NOT 被打包进 `@raven.js/core` npm 包
