## MODIFIED Requirements

### Requirement: 框架知识以仓库内 skill 承载且完全自包含

RavenJS 的分层方法论、API/运行时教学与 AI-native 定位 SHALL 全部以 skill 形态承载，置于本仓库内。`raven-use` skill SHALL **完全自包含**：API 表面、请求生命周期、ambient state/DI、schema 与 contract、插件、OpenAPI、gotcha 以及分层 pattern 规则，SHALL 全部随 skill 一起分发于 `skills/raven-use/reference/`（API/运行时教学位于 `reference/api/`，分层方法论位于 `reference/` 顶层）。

skill SHALL NOT 依赖从 `node_modules/@raven.js/core` 读取任何教学文档；skill MAY 指引 Agent 读取随包发布的类型声明 `node_modules/@raven.js/core/dist/index.d.mts` 以核对与安装版本匹配的精确类型签名。skill SHALL 教 Agent 使用已发布的 `@raven.js/core` npm 包 API 与分层写法，而非管理 vendored 源码。

#### Scenario: skill 教学 npm 包 API

- **WHEN** Agent 加载 `raven-use` skill 编写应用代码
- **THEN** skill SHALL 指导从 `@raven.js/core`（运行时 API）与 `@raven.js/core/contract`（前端安全的 contract 入口）导入并使用公共 API
- **AND** SHALL NOT 包含拷贝/同步框架源码的指令

#### Scenario: skill 自带全部教学文档

- **WHEN** Agent 需要理解 API、请求生命周期、state/DI、schema/contract、插件、OpenAPI、gotcha 或分层 pattern
- **THEN** skill SHALL 把 Agent 分流到自带的 `reference/*`（含 `reference/api/*`）文档
- **AND** SHALL NOT 要求 Agent 从 `node_modules/@raven.js/core` 读取 `GUIDE.md` / `README.md` / `PLUGIN.md` 等教学文档

#### Scenario: 精确签名核对走类型声明

- **WHEN** Agent 需要确认某个 API 的精确类型签名
- **THEN** skill SHALL 指引其读取 `node_modules/@raven.js/core/dist/index.d.mts`
- **AND** 概念、生命周期与 gotcha 的权威来源 SHALL 仍是 skill 自带的 `reference/*`

### Requirement: skill 与教学文档均不进入 npm 包、RavenJS 不自建安装器

skill 文件 SHALL 仅存放于本仓库（不进入 `@raven.js/core` npm 包的分发物）。框架的教学文档（API/运行时/分层 pattern 等）SHALL NOT 被打包进 `@raven.js/core` npm 包——npm 包发布物 SHALL 仅包含构建产物（`dist`）、精简 README 与 LICENSE。RavenJS SHALL NOT 提供任何自建的 skill 安装器（不提供 `install-raven` 或等价 CLI、可执行包或脚本）。文档 MAY 推荐通用第三方 skills CLI（如 [vercel-labs/skills](https://github.com/vercel-labs/skills)）直接从本仓库拉取 skill，并 SHALL 同时保留手动拷贝作为备选路径。

#### Scenario: 文档推荐通用 CLI 或手动拷贝

- **WHEN** 用户希望在自己项目中使用 RavenJS skill
- **THEN** 文档 SHALL 说明用通用第三方 skills CLI 从仓库安装（`npx skills add <repo>`）
- **AND** SHALL 保留从仓库手动拷贝 skill 到目标 skill 目录的备选说明

#### Scenario: npm 包不分发 skill 与教学文档

- **WHEN** 检查 `@raven.js/core` 的发布物
- **THEN** SHALL NOT 包含任何 RavenJS 自建的、用于安装 skill 的可执行包或脚本
- **AND** skill 文件与教学文档（`GUIDE.md` / `PLUGIN.md` / 分层 pattern 等）SHALL NOT 被打包进 `@raven.js/core` npm 包
