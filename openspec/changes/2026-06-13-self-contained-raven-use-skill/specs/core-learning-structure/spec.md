## MODIFIED Requirements

### Requirement: 文档与测试必须映射学习结构

`raven-use` skill 自带的 `reference/*` 文档与 `tests/unit/core` SHALL 与当前推荐的源码结构保持一致，向 Agent 提供与源码边界对应的 API / 运行时 / 分层学习路径和可执行示例。

API / 运行时学习路径 SHALL 由 skill 自带的 `reference/api/*`（`overview`、`lifecycle`、`state-and-di`、`schema-and-contract`、`plugins`、`openapi`、`gotchas`）承载，并 SHALL 用与源码边界一致的概念术语（contract / app / runtime / state / schema / context / error / openapi）描述"理解某类问题时应该看哪里"。这些文档 SHALL NOT 把 `.ts` 源码文件作为安装态的阅读入口（源码不随包发布），而 SHALL 以散文化教学 + 指向 `dist/index.d.mts` 的精确类型核对来表达。

`packages/core/README.md` SHALL 仅作为 npm 门面（概览 / 安装 / 快速上手 / 指向 `raven-use` skill），SHALL NOT 再承载 SOURCE MAP / READING PATHS / 深度概念 / 架构 / 设计取舍 / gotcha 等学习内容，也 SHALL NOT 链接分层 pattern 文档。`packages/core/GUIDE.md` SHALL NOT 存在（其阅读入口与分流角色由 skill 的 `SKILL.md`（Step 1）承担，`reference/` 内 SHALL NOT 另设独立索引文件）。

被技能引用的 reference 文档 MUST 使用与当前推荐结构一致的路径术语（以 `<app_root>` 表达 app 业务代码根目录），避免把 `src/raven` 暗示为唯一合法布局，同时 MUST 使用对 Agent 更稳定的业务结构语言，而不再把 `Projection` 作为推荐术语。对于接口对外暴露与文档导出场景，reference 文档 MUST 以 app 级 runtime OpenAPI export 作为推荐路径，并 MUST NOT 继续把 `raven build-contract`、独立 contract package 或 contract artifact bundle 描述为默认实践。

#### Scenario: skill reference 指向真实阅读路径

- **WHEN** Agent 通过 `raven-use` skill 学习 core 的 API / 源码实现
- **THEN** skill 的 `SKILL.md`（Step 1）SHALL 把 Agent 分流到使用与当前源码边界一致概念术语的 `reference/api/*` 文档
- **AND** 说明"理解某类问题时应该看哪个 reference 文档"，并指向 `dist/index.d.mts` 核对精确类型
- **AND** SHALL NOT 把不随包发布的 `.ts` 源码文件当作安装态阅读入口

#### Scenario: npm README 仅作门面

- **WHEN** Agent 或开发者打开 `packages/core/README.md`
- **THEN** 该文件 SHALL 仅提供概览 / 安装 / 快速上手 / 指向 `raven-use` skill
- **AND** SHALL NOT 承载 SOURCE MAP / READING PATHS / 深度概念 / 架构 / gotcha，也 SHALL NOT 链接分层 pattern 文档

#### Scenario: 业务代码任务由技能 reference 分流

- **WHEN** Agent 需要设计 `interface`、`entity`、`repository`、`command`、`query`、`dto` 或查询结果映射等业务代码结构
- **THEN** `raven-use` 技能 SHALL 把 Agent 分流到自带的 `reference/overview.md`
- **AND** SHALL 继续把 Agent 分流到 `reference/layer-responsibilities.md`、`reference/conventions.md` 或 `reference/anti-patterns.md`

#### Scenario: runtime assembly 任务由技能 reference 分流

- **WHEN** Agent 需要处理 plugin、state、hook 或 `app.ts` 组合根问题
- **THEN** `raven-use` 技能 SHALL 把 Agent 分流到 `reference/runtime-assembly.md`（并按需配合 `reference/api/plugins.md`、`reference/api/state-and-di.md`、`reference/api/lifecycle.md`）
- **AND** 该 runtime assembly 规则 SHALL 使用 `<app_root>/app.ts` 作为默认组合根示例

#### Scenario: reference 文档使用一致的目录术语

- **WHEN** Agent 阅读 `reference/conventions.md` 或 `reference/runtime-assembly.md`
- **THEN** 文档 SHALL 使用 `<app_root>` 表达 Raven app 的业务代码根目录
- **AND** SHALL 不再把 runtime assembly 描述为固定放在 `src/raven/`

#### Scenario: 文档推荐 runtime OpenAPI export

- **WHEN** Agent 或开发者从 skill reference 查找 Raven 如何对外暴露 OpenAPI
- **THEN** 文档 SHALL 推荐在 app 组合根调用 `app.exportOpenAPI(...)`
- **AND** SHALL 说明 OpenAPI 导出的真相源是"当前 app 实际注册成功的 contract routes"

#### Scenario: 测试结构映射概念边界

- **WHEN** Agent 浏览 `tests/unit/core`
- **THEN** 测试文件或目录 SHALL 以核心概念边界命名或分组
- **AND** Agent SHALL 能从测试名称推断对应源码模块
