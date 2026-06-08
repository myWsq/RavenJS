# RavenJS 2.x → 3.x 迁移指南

> 适用对象：已经在使用 RavenJS 2.x 的项目，以及辅助维护这些项目的 AI Agent。
> 阅读建议：先看第 1 节理解 3.x 的整体变化，再按第 2、3 节完成机械式迁移，最后用第 4 节逐条核对行为差异。

---

## 1. 概述：3.x 是一次破坏性重写

RavenJS 3.x 在**底层实现**上是一次彻底重写，但在**对外 API 语义**上刻意保持稳定。请先建立以下四个核心认知：

- **底盘换 Hono**：HTTP 接收、路由匹配、serve 管线全部由 [Hono](https://hono.dev) 承担，替换了 2.x 的自研 `RadixRouter` 与自研 dispatch 收发管线。Hono 的 context `c` 是**内部实现细节，永不暴露给应用作者**——你的 handler 仍然只拿到校验后的 `{ body, query, params, headers }`，请求信息照旧通过 ambient state（如 `RavenContext`）读取。
- **分发改 npm 包**：3.x 以标准 npm 包 `@raven.js/core`（版本 3.x）分发，`hono` 为 peerDependency。不再把框架源码拷进你的项目。
- **放弃 vendoring 与 CLI**：不再有 "把核心代码拷进项目" 的 vendoring 机制；不再有 `@raven.js/cli`、`install-raven`、`raven sync` / `raven init` / `raven status` / `bunx raven` 等命令。
- **从 Bun-only 改为多运行时**：3.x 支持 **Node（20+）、Bun、Deno** 三个 server 端运行时（不支持 edge / Cloudflare Workers）。框架自身不监听端口，serve 交给各运行时或官方适配器。

**保持不变的设计哲学（对外语义不变）**：

- Contract-first（contract 是可序列化纯值，前端可直接 import）。
- Standard Schema（schema 库无关，Zod / Valibot 等皆可）。
- Ambient state DI（`AppState` / `RequestState` + scope，`.get()` / `.getOrFailed()`，handler 不接 `c`）。
- Plugin / lifecycle 钩子（`onRequest` / `beforeHandle` / `beforeResponse` / `onError` / `onLoaded` / `onResponseValidationError`）。
- 自研 OpenAPI 生成器（`app.exportOpenAPI(...)` / `app.getOpenAPIDocument()`），**不引入** `@hono/zod-openapi`。

> 一句话总结：换发动机、换分发渠道、扩运行时；但你写 contract、写 handler、读 state、挂钩子的方式基本照旧。

---

## 2. 安装与依赖迁移

### 2.1 旧的获取方式（2.x）

2.x 通过 "vendoring + CLI" 获取框架：安装 `@raven.js/cli` 与 `install-raven`，运行 `raven sync` 把核心代码拷进项目的 `raven/` 根目录，并在 `tsconfig.json` 中把 `@raven.js/*` 映射到 `./raven/*`。

### 2.2 新的安装方式（3.x）

直接作为依赖安装：

```bash
npm install @raven.js/core hono
# 或 pnpm add @raven.js/core hono
# 或 yarn add @raven.js/core hono
# 或 bun add @raven.js/core hono
```

### 2.3 迁移步骤

1. **安装依赖**：执行上面的 `npm install @raven.js/core hono`。
2. **删除 vendoring 产物**：删除项目里被拷入的 `raven/` 根目录（整个核心源码树）。
3. **清理 tsconfig 映射**：删除 `tsconfig.json` 中把 `@raven.js/*` 指向 `./raven/*` 的 `paths` 映射。

   ```jsonc
   // 删除这一段：
   {
     "compilerOptions": {
       "paths": {
         "@raven.js/*": ["./raven/*"], // ← 删除
       },
     },
   }
   ```

4. **卸载退役工具**：移除 `@raven.js/cli`、`install-raven` 及任何 `raven sync` 相关脚本（package.json 的 scripts、CI 步骤等）。
5. **改写 import**：把所有从本地 raven 路径的 import 改为从包名导入。

   ```ts
   // 旧（2.x，从 vendored 本地路径）
   import { Raven, defineContract } from "./raven";
   import { Raven } from "@raven.js/core"; // 映射到 ./raven/* 的写法也一并替换

   // 新（3.x，标准包导入）
   import { Raven, defineContract } from "@raven.js/core";
   ```

> 公共 API 命名在 3.x 保持稳定（`Raven`、`definePlugin`、`registerContractRoute`、`defineContract`、`AppState` / `RequestState`、`withSchema`、`RavenError` 等），改完 import 路径后通常无需改动 API 调用。
> 注意：`RadixRouter` 与 `RouteMatch` 已**不再导出**（它们是旧引擎的内部类型）。若你的项目曾经 import 过它们，需要移除。

---

## 3. 启动方式迁移

### 3.1 旧的启动方式（2.x，Bun-only）

```ts
// 2.x
import { app } from "./app";

Bun.serve({
  port: 3000,
  fetch: (req) => app.handle(req),
});
```

### 3.2 新的启动方式（3.x，多运行时）

3.x 中 **`app.handle` 已不存在**。统一通过 `app.ready()` 拿到一个 Web 标准 FetchHandler（`(request: Request) => Promise<Response>`），再交给对应运行时的 serve：

```ts
const fetch = await app.ready();
```

框架自身不监听端口；serve 由各运行时 / 官方适配器负责。三种运行时的最小片段如下：

**Node（20+，使用 `@hono/node-server`）**

```ts
import { serve } from "@hono/node-server";
import { app } from "./app";

serve({ fetch: await app.ready(), port: 3000 });
```

**Bun（原生）**

```ts
import { app } from "./app";

export default { port: 3000, fetch: await app.ready() };
```

**Deno（原生）**

```ts
import { app } from "./app";

Deno.serve({ port: 3000 }, await app.ready());
```

> 迁移要点：把 `Bun.serve({ fetch: (req) => app.handle(req) })` 整段替换为 `await app.ready()` + 上面对应运行时的片段。不要再调用 `app.handle`。

---

## 4. 行为变更清单（逐条 旧 → 新 + 应对）

以下差异由路由引擎换成 Hono 带来。**核心生命周期 / ambient state / schema 校验语义与 2.x 逐项等价（已实测）**，所以下面只列出真正会影响行为的点。

### 4.1 HEAD 请求（无变化，但需说明）

- **旧 → 新**：对仅注册了 `GET` 的路由，`HEAD` 请求在 2.x 与 3.x 中**都返回 404**。
- **说明**：Hono 默认会为 GET 路由自动派生 HEAD 响应；3.x 已**显式拦截**该 auto-HEAD 行为，以保持与 2.x 一致，并避免 GET handler 的副作用被 HEAD 请求意外触发。
- **应对**：无需改动。若你确实需要 HEAD，请显式注册对应路由。

### 4.2 尾随斜杠：严格区分

- **旧 → 新**：2.x 会对尾随斜杠做归一化命中（`/foo` 与 `/foo/` 命中同一路由）；3.x **严格区分** `/foo` 与 `/foo/`。
- **应对**：核对客户端调用与路由注册的路径是否在尾随斜杠上一致。如需兼容两种写法，请显式注册两条路由，或在前置环节自行做归一化。

### 4.3 路径参数：自动解码

- **旧 → 新**：2.x 保留原始百分号编码的参数值；3.x 经 Hono **自动 `decodeURIComponent`**，handler 拿到的是已解码的值。
- **应对**：如果你的 handler 此前手动 `decodeURIComponent(params.x)`，请移除该重复解码，否则会出现二次解码错误。

### 4.4 通配符：匹配零段

- **旧 → 新**：2.x 中 `/path/*` 要求至少一个尾段才命中；3.x 中 `/path/*` 现在也匹配 `/path/` 与裸 `/path`。
- **应对**：如果你依赖 "通配符必须有尾段" 来区分裸路径与子路径，请在 handler 内显式判断尾段是否为空，或调整路由结构。

### 4.5 `beforeResponse` 抛错：改走 `onError`

- **旧 → 新**：2.x 中 `beforeResponse` 钩子抛错会逃逸为 unhandled rejection（属潜在 bug）；3.x 中该错误现在经 **`onError` 链**统一处理。
- **应对**：通常是改善。请确认你的 `onError` 处理逻辑能正确兜底 `beforeResponse` 阶段抛出的错误。

> 其余核心语义（请求生命周期顺序、ambient state 的 scope 行为、schema 校验与 `ValidationError` 触发时机等）与 2.x 等价，无需迁移改动。

---

## 5. skill 与文档分发的变化

### 5.1 CLI / install-raven 退役

- `@raven.js/cli` 与 `install-raven` 已退役，**不再提供任何安装器**。
- 之前由 CLI 自动安装 skill 的流程不复存在。

### 5.2 skill 改为手动拷贝

- RavenJS 仍是 AI-native 框架，知识以 **skill** 承载。
- skill 文件**只放在仓库的 `skills/` 目录**。请手动把需要的 skill 拷贝到你自己项目的 `.claude/skills/`（或 `.cursor/skills`、`.trae/skills`）。

### 5.3 API / pattern 文档随包发布

- 框架的 API / 架构 / pattern 文档随 `@raven.js/core` 包一起发布：`GUIDE.md`、`pattern/`、`PLUGIN.md`。
- Agent 应从 `node_modules/@raven.js/core/` 读取这些文档（教学 skill 据此定位）。

---

## 6. 最小 before / after 对照

**Before（2.x）**

```ts
// app.ts
import { Raven, defineContract } from "./raven"; // vendored 本地路径
import { z } from "zod";

const app = new Raven();

const greet = defineContract({
  method: "get",
  path: "/hello/:name",
  // ...
});

app.registerContractRoute(greet, async ({ params }) => {
  return { message: `Hello ${params.name}` };
});

export { app };

// server.ts
import { app } from "./app";

Bun.serve({
  port: 3000,
  fetch: (req) => app.handle(req), // app.handle + Bun-only
});
```

**After（3.x，以 Node 为例）**

```ts
// app.ts
import { Raven, defineContract } from "@raven.js/core"; // 标准包导入
import { z } from "zod";

const app = new Raven();

const greet = defineContract({
  method: "get",
  path: "/hello/:name",
  // ...
});

app.registerContractRoute(greet, async ({ params }) => {
  // 注意：3.x 中 params.name 已被自动 decodeURIComponent
  return { message: `Hello ${params.name}` };
});

export { app };

// server.ts（Node 运行时）
import { serve } from "@hono/node-server";
import { app } from "./app";

serve({ fetch: await app.ready(), port: 3000 }); // app.ready() 取代 app.handle
```

> contract 定义、handler 入参 `{ body, query, params, headers }`、state 读取与钩子注册方式均保持不变；变化集中在 import 路径、启动方式（`app.ready()` 取代 `app.handle`）以及第 4 节列出的引擎级行为差异。
