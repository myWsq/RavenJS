## Context

RavenJS 2.x 的 core 已经是"纯逻辑层"——`ready()` 返回 Web 标准 `FetchHandler`，源码内无 `Bun.serve` / `node:http`，运行时兼容已部分外包。但它仍自研了 `RadixRouter` 与 `runtime/dispatch-request.ts` 的 HTTP 收发管线，并以 vendoring（CLI 拷源码进用户项目）方式分发。

3.x 在已与用户锁定的方向下做破坏性重写：底盘换成 Hono，分发改为 npm 包，**全部设计哲学原样保留**。关键观察是——RavenJS 的差异化（contract-first 可序列化契约、Standard Schema 库无关、基于 `AsyncLocalStorage` 的 ambient state DI、plugin/lifecycle、自研 OpenAPI）都坐在 HTTP 收发之上，与 Hono 不在同一层；只要把 Hono 的 `c` 藏成内部细节，两者各管一层、互不冲突。Hono 真正替换的面积仅为：路由 + HTTP 管线 + serve/运行时兼容。

## Goals / Non-Goals

**Goals:**

- 用 Hono 承担路由、HTTP 收发、serve（经官方 adapter，覆盖 Node + Bun + Deno server 端）。
- `@raven.js/core` 作为标准 npm 包发布，`hono` 为 peer dependency。
- 完整保留对外设计哲学与公共 API 语义：contract-first、Standard Schema、ambient state DI、plugin/lifecycle、自研 OpenAPI。
- Hono `c` 永不泄漏给应用作者（handler/hook/plugin 不接 `c`）。
- 框架知识全部转为仓库内 skill，手动拷贝，无安装器。

**Non-Goals:**

- 不支持 edge/Workers（因此不为 `AsyncLocalStorage` 设计降级方案）。
- 不引入 `@hono/zod-openapi`（会强制 Zod + `c` 模型，违背哲学）。
- 不保留 2.x 的 vendoring/CLI/sync 机制与向后兼容。
- 不重写业务分层方法论本身（只改其承载形态为 skill）。

## Decisions

### 决策 1：Hono 仅作"引擎"，逻辑哲学层不动

把 `RadixRouter` 删除、`dispatch-request.ts` 的收发部分改写为"注册到 Hono 实例 + 一个根中间件"。契约路由经 `hono.on(method, path, honoHandler)` 注册；`honoHandler` 内部完成：起 per-request `AsyncLocalStorage` → 把 `c` 抓入 `RavenContext` ambient state → 请求 schema 校验并写入 `Params/Query/Body/Headers` state → 执行 `beforeHandle` → 调用户 handler → response schema 校验/序列化 → `beforeResponse`。

- **为什么**：保持现有生命周期与 state 语义完全不变，应用作者无感知。
- **替代方案**：让 handler 直接接 Hono `c`（即拥抱 Hono 原生写法）——被否，等于放弃 ambient state 这根支柱，违背"保留哲学"的前提。

### 决策 2：`c` 作为内部实现细节，仅经 ambient state 暴露请求信息

根中间件是唯一接触 `c` 的地方。原始 `Request`、path params、query 等从 `c` 取出后写入对应 ambient state；handler/hook/plugin 一律通过 `.get()`/`.getOrFailed()` 读取。

- **为什么**：这是"用 Hono 但保留哲学"的关键约束，决定了两层不冲突。
- **替代方案**：暴露一个 `c` 的薄封装给高级用户——暂不做，避免哲学口子被打开。

### 决策 3：serve 完全交给 Hono 官方 adapter

框架暴露内部 Hono 实例与/或其 `fetch`。Node 用 `@hono/node-server`，Bun/Deno 用运行时原生 fetch。框架内零运行时检测分支。

- **为什么**：直接达成"不自己处理运行时兼容"，且收敛到 server 端运行时让 `AsyncLocalStorage` 无条件可用。

### 决策 4：OpenAPI 生成器保留自研

继续从可序列化 contract（Standard Schema → JSON Schema 的现有 materialize 链路）生成 OpenAPI，不引 `@hono/zod-openapi`。

- **为什么**：`@hono/zod-openapi` 强绑 Zod + `c`，与"Standard Schema 库无关 + contract 为纯值"直接冲突。

### 决策 5：core 改为可发布 npm 包

去 `private`；加 build（产出 JS + `.d.ts`）；`exports` 对齐 `index.ts` 导出面；`hono` 列 peer；`files` 白名单仅含产物与文档。内部相对 import 在构建中解析，发布产物不含 `.ts` 运行时扩展名假设。

- **替代方案**：发布未编译 `.ts`（依赖消费方 TS 运行时）——被否，限制消费方运行时、不通用。

### 决策 6：知识全部转 skill，仓库内手动拷、无安装器

退役 `@raven.js/cli` 与 `install-raven`；分层方法论、API 教学、AI-native 定位以 skill 表达，置于仓库，文档引导手动拷贝。

## Risks / Trade-offs

- [手动拷 skill 体验比 `bunx install-raven` 差] → 用清晰文档与固定目录约定弥补；用户群以 AI Agent 为主，可由 skill 自身说明拷贝路径。
- [`hono` 作为 peer，版本不匹配可能引发问题] → 在 `peerDependencies` 标明兼容区间；文档给出推荐版本。
- [`c` 隐藏导致高级用户无法用 Hono 原生中间件生态] → 接受此 trade-off；如确有需要，未来可在不破坏哲学前提下提供受控逃生通道（Open Question）。
- [破坏性重写，2.x 用户迁移成本高] → 通过 3.x major、迁移文档与 skill 引导降低；不承诺自动迁移。
- [大量 vendoring 相关 spec/包需归档] → 在 tasks 中显式列出归档清单，避免遗漏。

## Migration Plan

1. core：删 `routing/radix-router.ts`，改写 `runtime/dispatch-request.ts` 为 Hono 注册 + 根中间件；接入 `hono`（peer）。
2. core：补 build / `exports` / `types` / `files`，去 `private`，发布预演。
3. serve 文档：给出 Node（`@hono/node-server`）与 Bun/Deno（原生 fetch）两条 serve 路径。
4. 退役包：停止发布 `@raven.js/cli`、`install-raven`；归档相关 spec。
5. skill：将方法论/教学/定位重写为面向 npm 包的 skill，置于仓库并写明手动拷贝指引。
6. 文档：重写 README/GUIDE/pattern 叙事为"npm 包 + 手动拷 skill"。
7. 发布 3.0.0（major，破坏性）。

回滚：3.x 与 2.x 为不同 major，保留 2.x 分支与 npm tag，必要时用户可继续使用 2.x。

## 行为变更清单（CHANGELOG / 迁移指南素材）

经对抗式审查（实测 OLD 2.x vs NEW 3.x 逐项对比）确认：核心生命周期 / ambient state / schema 校验语义与 2.x **逐项等价**（onRequest 短路不建 Context、404 走 onError、错误归一化、processStates、RavenContext 就绪、query 同名末值覆盖均一致）。以下为换 Hono 路由引擎带来的、被接受并需在 CHANGELOG/迁移指南记录的破坏性行为变更：

- **HEAD 请求（已修复为保持 2.x 语义）**：Hono 默认把 HEAD 自动派发到同路径 GET 路由并执行完整生命周期（含副作用），仅剥离 body。已在 `make-raven-handler.ts` 顶部拦截：`HttpMethod` 不含 HEAD（无法注册 HEAD 路由），故 HEAD 一律走 `notFound` → 404，与 2.x 一致且避免 GET handler 副作用被 HEAD 触发。
- **尾随斜杠严格区分**：`/foo` 与 `/foo/` 视为不同路由（2.x 的 RadixRouter 归一化空段，二者皆命中）。`//foo` 同理不再命中 `/foo`。
- **路径参数自动解码**：path 参数经 Hono `decodeURIComponent`（如 `:id` 收到 `a%20b` → `a b`，`%2F` → `/`；非法编码如 `%2G` 原样保留）。2.x 保留原始百分号编码段。影响业务 handler 输入与 params schema 校验输入。
- **通配符匹配范围变宽**：`/path/*` 现在也匹配 `/path/`（零尾段）与裸 `/path`；2.x 的 RadixRouter 要求至少一个尾段。
- **beforeResponse 钩子抛错归宿（已修正为更一致行为）**：2.x 中 beforeResponse 抛错因 un-awaited promise 逃逸出 fetch 成为 unhandled rejection、绕过 onError（潜在 bug，且是唯一绕过 onError 的钩子）；3.x 起与其它钩子一致，经 onError 链处理并回退 500。

上述每条均已有回归测试锁定（`tests/unit/core/routing/raven-routing.test.ts` 的 "3.x Hono engine semantics" 块、`tests/unit/core/runtime/hooks.test.ts`）。

## Open Questions

- 是否需要为高级用户提供一个受控的 Hono 中间件接入点（在不破坏 ambient 哲学前提下）？默认不做，待真实需求出现再评估。
- 发布包名：沿用 `@raven.js/core` 还是借 major 调整？默认沿用。
- build 工具选型（tsup / unbuild / tsc）——实现阶段定，本设计不约束。
