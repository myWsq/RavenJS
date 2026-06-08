## 1. 接入 Hono 引擎

- [x] 1.1 在 `@raven.js/core` 引入 `hono`，先作为 devDependency 验证、最终落为 peerDependency
- [x] 1.2 在 `Raven` 内部持有一个 Hono 实例，并暴露获取该实例与 fetch handler 的途径
- [x] 1.3 删除 `routing/radix-router.ts` 及其全部引用
- [x] 1.4 将契约/方法路由注册改为经 `hono.on(method, path, honoHandler)` 注册到内部 Hono 实例
- [x] 1.5 改写 `runtime/dispatch-request.ts`：HTTP 收发改由 Hono 承担，保留生命周期编排逻辑

## 2. 根中间件与 ambient context

- [x] 2.1 在内部 Hono 实例安装根中间件，per-request 建立 `AsyncLocalStorage`（app scope + request scope）
- [x] 2.2 在根中间件中将 Hono `c` 抓入 `RavenContext` ambient state，确保不向 handler/hook/plugin 暴露 `c`
- [x] 2.3 从 `c` 提取原始 Request / path params / query 并写入对应内建 state（`ParamsState`/`QueryState`/`BodyState`/`HeadersState`）
- [x] 2.4 在 honoHandler 内串起完整生命周期顺序：onRequest → processStates（请求 schema 校验+写入）→ beforeHandle → Handler → response schema 校验/序列化 → beforeResponse
- [x] 2.5 校验并发请求下 request-scope state 的隔离性

## 3. serve 与运行时

- [x] 3.1 移除任何运行时检测/兼容代码与自带 serve 假设
- [x] 3.2 文档化 Node serve 路径（`@hono/node-server` 承载内部 Hono 实例）
- [x] 3.3 文档化 Bun/Deno serve 路径（原生 fetch 承载暴露的 fetch handler）
- [x] 3.4 声明受支持运行时为 Node + Bun + Deno（server），明确不支持 edge/Workers

## 4. 保留的哲学层验证

- [x] 4.1 验证 contract-first：contract 仍为可序列化纯值，前端可直接 import
- [x] 4.2 验证 Standard Schema 校验链路（请求/响应）在 Hono 之上行为不变
- [x] 4.3 验证 ambient state DI（`AppState`/`RequestState` + scope）行为不变，handler 不接 `c`
- [x] 4.4 验证 plugin/lifecycle（含 `onLoaded`、scope 注册、StateSetter 注入）行为不变
- [x] 4.5 验证自研 OpenAPI 生成器仍从 contract materialize 正常产出，未引入 `@hono/zod-openapi`

## 5. npm 包发布化

- [x] 5.1 `packages/core/package.json` 去除 `private: true`
- [x] 5.2 新增 build 步骤，产出 JS 与 `.d.ts`，确保内部相对 import 在产物中正确解析
- [x] 5.3 配置 `exports` / `types` / `main|module`，对齐 `index.ts` 公共导出面
- [x] 5.4 将 `hono` 声明为 `peerDependencies` 并标注兼容版本区间
- [x] 5.5 配置 `files` 白名单（仅产物与必要文档），进行 `npm publish --dry-run` 预演

## 6. 退役 vendoring 机制

- [x] 6.1 停止发布 `@raven.js/cli`，移除其 release 流程
- [x] 6.2 停止发布 `install-raven`，移除其 release 流程
- [x] 6.3 归档/废弃 vendoring 相关 spec（`cli-*`、`npm-cli-publish`、`install-raven`、`cli-embedded-source`、`smart-code-update`、`module-guide-requirement`、`agent-focused-cli` 等）
- [x] 6.4 从文档移除 `bunx install-raven` / `raven sync` 所有引用

## 7. skill 化与文档

- [x] 7.1 将分层方法论（interface/entity/repository pattern + 自检）重写为仓库内 skill
- [x] 7.2 将 API 教学重写为面向 `@raven.js/core` npm 包的 skill
- [x] 7.3 在 skill 与文档中写明手动拷贝路径与目录约定，确保无安装器
- [x] 7.4 重写 README / GUIDE / pattern 文档为"npm 包 + 手动拷 skill"叙事
- [x] 7.5 编写 2.x → 3.x 迁移指南

## 8. 测试与发布

- [x] 8.1 迁移并跑通现有单元/集成/e2e 测试到 Hono 引擎之上（替换 Bun-only 测试假设）
- [x] 8.2 补充根中间件、ambient 隔离、`c` 不泄漏的针对性测试
- [x] 8.3 在 Node + Bun + Deno 三运行时各跑一遍 serve 冒烟测试
- [ ] 8.4 发布 `@raven.js/core` 3.0.0（major），保留 2.x 分支与 tag 作为回滚路径

## 9. 去 Bun 化开发工具链（兑现“移除 Bun 专属工具链假设”）

- [x] 9.1 测试运行器 `bun:test` → vitest（11 文件迁移，`mock()` → `vi.fn()`，新增 vitest.config.ts）
- [x] 9.2 包管理器 bun → pnpm（删 bun.lock、生成 pnpm-lock.yaml、新增 pnpm-workspace.yaml）
- [x] 9.3 CI 由 `oven-sh/setup-bun` 改为 `pnpm/action-setup` + `actions/setup-node`
- [x] 9.4 `scripts/release.ts` 去 bun（`$` → `node:child_process`，`import.meta.dir` → `import.meta.dirname`），脚本经 tsx 运行
- [x] 9.5 移除 `@types/bun` 与 tsconfig `types:["bun"]`，改用 `@types/node`；根 package.json 脚本改 vitest/pnpm/tsx
