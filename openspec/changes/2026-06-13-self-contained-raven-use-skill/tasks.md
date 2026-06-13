## 1. skill 重写为自包含

- [x] 1.1 重写 `skills/raven-use/SKILL.md`：Step 0 仅确认包可解析 + 指向 `dist/index.d.mts`；Step 1 改为从自带 `reference/` 学习；Guardrails 去掉读 node_modules 文档；更新 frontmatter `description` / `compatibility`
- [x] 1.2 由 `SKILL.md`（Step 1）承担导航与分流（区分 API/运行时组与分层方法论组、两类 anti-pattern 文档分工）；不在 `reference/` 内另设索引文件
- [x] 1.3 新增 `reference/api/overview.md`（API 表面 + 概念地图 + 核心概念）
- [x] 1.4 新增 `reference/api/lifecycle.md`（构建/请求生命周期、两层 ALS、HEAD、query 末值、三条错误路径）
- [x] 1.5 新增 `reference/api/state-and-di.md`（ScopedState、AppState/RequestState、内建 state、scope、两条写入路径）
- [x] 1.6 新增 `reference/api/schema-and-contract.md`（withSchema、请求/响应校验行为、SchemaClass、defineContract、类型方向）
- [x] 1.7 新增 `reference/api/plugins.md`（源自 PLUGIN.md：definePlugin、register/use/onLoaded、4 个 state pattern、gotcha）
- [x] 1.8 新增 `reference/api/openapi.md`（exportOpenAPI/getOpenAPIDocument/buildOpenAPIDocument、收录规则、硬编码行为、缓存）
- [x] 1.9 新增 `reference/api/gotchas.md`（框架级 gotcha + 运行时反模式 + 自检框架半）
- [x] 1.10 现有 5 个 pattern 文档保留；`runtime-assembly.md` 示例补 state `name`

## 2. npm 包不再打包教学文档

- [x] 2.1 `packages/core/package.json`：`files` 收紧为 `["dist", "README.md", "LICENSE"]`
- [x] 2.2 删除 `packages/core/GUIDE.md`、`packages/core/PLUGIN.md`
- [x] 2.3 精简 `packages/core/README.md` 为 npm 门面（概览/安装/快速上手/指向 skill）

## 3. 前端安全的 contract 子入口

- [x] 3.1 `tsdown.config.ts` 增加 `contract/index.ts` 构建入口
- [x] 3.2 `package.json` `exports` 新增 `./contract`（types + import）
- [x] 3.3 验证 `dist/contract/index.{mjs,d.mts}` 产出且不含 Hono/ALS 运行时

## 4. 外部引用同步

- [x] 4.1 更新仓库根 `README.md`（Philosophy、AI Skills、Core Reference 三处）
- [x] 4.2 更新 `MIGRATION.md` 第 5.3 节

## 5. 验证

- [x] 5.1 `pnpm build` 成功，新增 `dist/contract/` 产物
- [x] 5.2 `pnpm test` 全绿（76 passed）
- [x] 5.3 `npm pack --dry-run` 文件清单不含 `GUIDE.md`/`PLUGIN.md`，含 `dist/contract/`
- [ ] 5.4 `openspec validate`（若 CLI 可用）通过

## 6. 归档（评审通过后）

- [ ] 6.1 将本 change 的 delta 合并回 `openspec/specs/*`，change 移入 `openspec/changes/archive/`
