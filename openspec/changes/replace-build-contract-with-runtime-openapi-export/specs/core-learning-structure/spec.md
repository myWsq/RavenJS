## MODIFIED Requirements

### Requirement: 文档与测试必须映射新的学习结构

`modules/core/GUIDE.md`、`modules/core/README.md`、`modules/core/pattern/*` 和 `tests/unit/core` SHALL 与当前推荐的源码结构和 pattern 目录约定保持一致，向 Agent 提供与源码边界对应的学习路径和可执行示例。对于业务代码与运行时装配任务，GUIDE / README MUST 进一步区分“理解 API / 源码实现”与“理解 pattern / 分层规则”两类入口，并显式链接到 `modules/core/pattern/*` 中对应的文档。被链接的 pattern 文档 MUST 使用与当前推荐结构一致的路径术语，避免把 `src/raven` 暗示为唯一合法布局，同时 MUST 使用对 Agent 更稳定的业务结构语言，而不再把 `Projection` 作为推荐术语。对于接口对外暴露与文档导出场景，README / GUIDE / pattern 文档 MUST 以 app 级 runtime OpenAPI export 作为推荐路径，并 MUST NOT 继续把 `raven build-contract`、独立 contract package 或 contract artifact bundle 描述为默认实践。

#### Scenario: GUIDE 指向真实阅读路径

- **WHEN** Agent 阅读 `modules/core/GUIDE.md`
- **THEN** 文档 SHALL 使用当前真实存在的目录或文件作为阅读入口
- **AND** 说明“理解某类问题时应该看哪里”

#### Scenario: GUIDE 为业务代码任务分流到 pattern 文档

- **WHEN** Agent 需要设计 `interface`、`entity`、`repository`、`command`、`query`、`dto` 或查询结果映射等业务代码结构
- **THEN** `modules/core/GUIDE.md` 或 `modules/core/README.md` SHALL 显式指向 `modules/core/pattern/overview.md`
- **AND** SHALL 继续把 Agent 分流到 `layer-responsibilities.md`、`conventions.md` 或 `anti-patterns.md` 等对应文档

#### Scenario: GUIDE 为 runtime assembly 任务分流到 Raven 专属规则

- **WHEN** Agent 需要处理 plugin、state、hook 或 `app.ts` 组合根问题
- **THEN** `modules/core/GUIDE.md` 或 `modules/core/README.md` SHALL 显式指向 `modules/core/pattern/runtime-assembly.md`
- **AND** 该学习路径引用的 runtime assembly 规则 SHALL 使用 `<app_root>/app.ts` 作为默认组合根示例

#### Scenario: Pattern 文档使用一致的目录术语

- **WHEN** Agent 从 GUIDE / README 跳转到 `modules/core/pattern/conventions.md` 或 `modules/core/pattern/runtime-assembly.md`
- **THEN** 文档 SHALL 使用 `<app_root>` 表达 Raven app 的业务代码根目录
- **AND** SHALL 不再把 runtime assembly 描述为固定放在 `src/raven/`

#### Scenario: 文档推荐 runtime OpenAPI export

- **WHEN** Agent 或开发者从 README / GUIDE / pattern 文档查找 Raven 如何对外暴露 OpenAPI
- **THEN** 文档 SHALL 推荐在 app 组合根调用 `app.exportOpenAPI(...)`
- **AND** SHALL 说明 OpenAPI 导出的真相源是“当前 app 实际注册成功的 contract routes”

#### Scenario: 文档移除 build-contract 工作流

- **WHEN** Agent 或开发者从 core README / GUIDE / pattern 文档查找跨项目 contract 分发或 OpenAPI 生成方案
- **THEN** 文档 SHALL 不再推荐 `raven build-contract`、独立 contract package 或 `raven-contract.json` / `openapi.json` / `openapi.yml` 产物工作流
- **AND** SHALL 使用 runtime OpenAPI export 替代这些旧描述

#### Scenario: 测试结构映射概念边界

- **WHEN** Agent 浏览 `tests/unit/core`
- **THEN** 测试文件或目录 SHALL 以新的核心概念边界命名或分组
- **AND** Agent SHALL 能从测试名称推断对应源码模块
