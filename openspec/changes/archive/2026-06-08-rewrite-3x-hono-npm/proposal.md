## Why

RavenJS 2.x 自研了 HTTP 收发、路由（RadixRouter）与运行时兼容层，并以"把源码 vendoring 进用户项目"的方式分发，配套 CLI / install-raven / sync 一整套机制维护成本高。Bun 生态不及预期，框架不应继续自己承担多运行时兼容；而 vendoring 模式让升级、版本管理与依赖治理都很重。3.x 借破坏性重写把底盘换成成熟的 Hono 引擎、改为标准 npm 包分发，同时**原样保留全部设计哲学**，让框架聚焦于自己的差异化价值。

## What Changes

- **BREAKING** 底层 HTTP 引擎替换为 Hono：路由、HTTP 管线、serve 全部交给 Hono 及其官方 adapter（Node 用 `@hono/node-server`，Bun/Deno 用原生 fetch）。Hono 的 context `c` 永远是内部实现细节，应用作者看不到。
- **BREAKING** 删除自研 `routing/radix-router.ts`、`runtime/dispatch-request.ts` 的 HTTP 收发部分，以及自研 serve / 运行时检测兼容层。
- **BREAKING** 分发方式从 vendoring 源码改为发布标准 npm 包 `@raven.js/core`：去掉 `private`，补 `exports` / 类型声明 / 构建产物，`hono` 作为 peer dependency。
- **BREAKING** 退役 `@raven.js/cli`、`install-raven`、`raven sync` 及一切 vendoring 形态机制（embedded source、smart code update、module guide registry 等）。
- 目标运行时收敛为 Node + Bun + Deno（server 端），**不含 edge/Workers**，因此 `AsyncLocalStorage` 无条件可用。
- **保留全部设计哲学**（坐在 Hono 之上，不改对外语义）：Contract-first（contract 为可序列化纯值）、Standard Schema（schema 库无关）、Ambient state DI（`AppState`/`RequestState` + scope，handler 不接 `c`）、Plugin / lifecycle、自研 OpenAPI 生成器（**不引** `@hono/zod-openapi`）。
- 分层方法论、API 教学、AI-native 定位全部以 **skill** 形态承载；skills 仅置于仓库，文档引导用户手动拷贝，**不提供任何安装器**。

## Capabilities

### New Capabilities

- `hono-engine`: 以 Hono 作为底层 HTTP/路由/serve 引擎的能力——根中间件内建立 per-request `AsyncLocalStorage`、把 `c` 抓入 ambient context 并对外隐藏、契约路由经 `hono.on(method, path, ...)` 注册、经官方 adapter 跨 Node/Bun/Deno serve。
- `npm-package-distribution`: `@raven.js/core` 作为标准 npm 包发布的能力——`exports`/类型/构建产物约定、`hono` 作为 peer dependency、版本与发布流程。
- `skill-based-distribution`: 框架知识（分层方法论、API 教学、AI-native 定位）以仓库内 skill 承载、用户手动拷贝、无安装器的分发能力。

### Modified Capabilities

- `core-framework`: HTTP server 与 routing 行为改为 Hono 驱动；移除自研 RadixRouter 与运行时兼容层；保留 contract-first、ambient state、plugin、OpenAPI 等对外语义。

## Impact

- **代码**：删除 `packages/core/routing/radix-router.ts`、改写 `packages/core/runtime/dispatch-request.ts`；`packages/core/package.json` 改为可发布（exports/build/peer dep hono）；contract / schema / state / openapi / plugin 模块对外 API 基本保留。
- **退役包**：`packages/cli`、`packages/install-raven` 不再发布；相关 spec（`cli-*`、`npm-cli-publish`、`install-raven`、`smart-code-update`、`cli-embedded-source`、`module-guide-requirement`、`agent-focused-cli` 等）随之归档/废弃。
- **依赖**：新增 `hono`（peer）、`@hono/node-server`；移除 Bun 专属工具链假设。
- **运行时**：支持 Node + Bun + Deno（server），不再声明 edge/Workers 支持。
- **分发与文档**：README / GUIDE / pattern 文档需重写为"npm 包 + 手动拷 skill"的叙事；不再有 `bunx install-raven` / `raven sync` 流程。
