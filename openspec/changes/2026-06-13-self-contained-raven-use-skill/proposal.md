## Why

3.x 把框架知识以 skill 承载，但只搬走了分层 pattern 文档：API / 架构 / 插件教学文档（`GUIDE.md`、`PLUGIN.md`，以及 `packages/core/README.md` 中的深度概念/生命周期/gotcha 内容）仍随 `@raven.js/core` npm 包发布，`raven-use` skill 在运行时从 `node_modules/@raven.js/core/` 读取它们。

这种"半搬"状态有三个问题：

1. **与既有 spec 自相矛盾**：`skill-based-distribution` 明确要求"分层方法论、**API 教学**、AI-native 定位 SHALL 全部以 skill 形态承载"，但 API 教学文档实际仍打包进 npm 包。
2. **教学来源是断的**：`GUIDE.md` 的 SOURCE MAP 指向 `app/raven.ts`、`runtime/dispatch-request.ts` 等源码文件，但包的 `files` 只发布 `dist`——`.ts` 源码根本不随包发布（且 `dispatch-request.ts` 已在 3.x 重写中删除）。Agent 按文档去 `node_modules` 找源码只会扑空。
3. **skill 不自包含**：教学被拆在"包内 API 文档 + skill 内 pattern 文档"两处，skill 无法独立分发与学习。

本变更把全部教学文档收敛进 `raven-use` skill，让 skill 完全自包含；npm 包回归"只发代码"的本分。

## What Changes

- **教学文档全部移入 skill**：将 `packages/core/GUIDE.md`、`packages/core/PLUGIN.md` 与 `packages/core/README.md` 的深度教学内容重写并迁入 `skills/raven-use/reference/`。新增 `reference/api/`（API/运行时教学组：`overview`、`lifecycle`、`state-and-di`、`schema-and-contract`、`plugins`、`openapi`、`gotchas`）；现有 5 个分层 pattern 文档保留在 `reference/` 顶层。导航与分流由 `SKILL.md`（Step 1）承担，不在 `reference/` 内另设索引文件。
- **按源码重写教学，纠正漂移**：内容依据对 core 源码与测试的逐文件验证重写，修正既有文档中的过时/错误点（如 `dispatch-request.ts` 死链、`openapi/` 目录实为单文件 `app/openapi.ts`、请求 `ValidationError` 默认 500 而非 400、响应校验失败 fail-open、仅 `registerContractRoute` 路由进 OpenAPI、route 冲突按归一化路径形状判定、`use()` 返回 `Promise<void>` 不触发 `onLoaded` 等）。
- **npm 包不再打包教学文档**：`packages/core/package.json` 的 `files` 收紧为 `["dist", "README.md", "LICENSE"]`；删除 `GUIDE.md`、`PLUGIN.md`；`packages/core/README.md` 精简为 npm 门面（概览 / 安装 / 快速上手 / 指向 skill）。
- **skill 改为自包含、不读 node_modules 文档**：重写 `SKILL.md`，Step 1 与 Guardrails 改为只从 skill 自带 `reference/` 学习；仅保留"确认 `@raven.js/core` 可解析"与"用 `dist/index.d.mts` 核对精确签名"。
- 新增前端安全的 **`@raven.js/core/contract` 子入口**：补齐 `package.json` 的 `exports` 与 tsdown 构建入口，使文档一直假定存在、但此前未导出的 `import { defineContract } from "@raven.js/core/contract"` 真正可解析。该子入口的依赖图不含任何运行时（无 Hono / AsyncLocalStorage / `Raven`），保障 `contract.ts` 前端安全。
- 同步更新仓库根 `README.md` 与 `MIGRATION.md` 中关于"从包内读文档"的叙述。

## Capabilities

### Modified Capabilities

- `skill-based-distribution`: 强化为"skill 完全自包含"——全部 API/运行时/pattern 教学随 skill 分发于 `reference/*`，skill SHALL NOT 从 `node_modules/@raven.js/core` 读取教学文档；教学文档 SHALL NOT 进入 npm 包。
- `core-learning-structure`: "API / 源码学习路径"入口从 `packages/core/GUIDE.md`、`README.md` 迁到 `raven-use` skill 的 `reference/*`；不再要求 `GUIDE.md` 存在或承载 SOURCE MAP / READING PATHS。
- `agent-teaching-docs`: npm 包内 README 放宽为精简门面，深度概念/架构/设计取舍/用法/gotcha 教学归属改判到 skill `reference/*`。
- `agent-first-experience`: Agent 的学习来源由"已安装包内随包 docs"改为"`raven-use` skill 自带 `reference/*`"。
- `npm-package-distribution`: 收紧 `files` 白名单并显式声明 npm 包不分发教学文档；`exports` 新增前端安全的 `./contract` 子入口。
- `plugin-examples`: 插件示例承载位置由 `packages/core/GUIDE.md` 改为 skill 的 `reference/api/plugins.md`。

## Impact

- **代码 / 包**：删除 `packages/core/GUIDE.md`、`packages/core/PLUGIN.md`；精简 `packages/core/README.md`；`package.json` 收紧 `files`、新增 `./contract` 导出；`tsdown.config.ts` 增加 `contract/index.ts` 构建入口。运行时与公共 API 行为不变；76 个测试全部通过，构建产物新增 `dist/contract/`。
- **skill**：重写 `skills/raven-use/SKILL.md`（兼任入口与导航）；新增 `reference/api/*.md`（7 个）；现有 5 个 pattern 文档保留（仅一处示例补 state name）。
- **文档**：更新仓库根 `README.md`、`MIGRATION.md` 中"包内读文档"的叙述。
- **分发可观测指标**：`npm pack --dry-run` 的文件清单只含 `dist`、`README.md`、`LICENSE`，不含 `GUIDE.md` / `PLUGIN.md`。
- **非目标**：不改动框架运行时行为、公共 API 语义、Hono 引擎接入；不翻译既有英文 skill 文档为中文（skill 教学文档保持英文，仅 openspec 治理产物用中文）。
