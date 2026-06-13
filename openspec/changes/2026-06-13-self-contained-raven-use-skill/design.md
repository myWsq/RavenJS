## 背景

`raven-use` 当前的学习链路是：`SKILL.md` Step 1 让 Agent 去 `node_modules/@raven.js/core/` 读 `GUIDE.md` / `README.md` / `PLUGIN.md`（声称"版本匹配"），pattern 规则才从 skill 自带 `reference/` 读。但包的 `files` 只发 `dist`，`.ts` 源码不随包发布，`GUIDE.md` 的 SOURCE MAP 指向的源文件在安装态根本不存在，"版本匹配的源码阅读路径"实际是断的。

## 决策

### 1. skill 完全自包含，npm 包只发代码

把全部教学文档迁入 skill，npm 包不再打包任何教学文档。唯一与安装版本匹配的精确接口参考是随包发布的类型声明 `dist/index.d.mts`——这是"版本匹配"承诺中真实可用的部分，skill 保留对它的指引用于核对精确签名。概念/生命周期/gotcha 以 skill 自带文档为准。

**取舍**：skill 文档可能滞后于独立升级的 npm 包。缓解：(a) `SKILL.md` 要求用 `dist/index.d.mts` 核对精确签名；(b) skill 文档与框架同仓库、同 PR 演进；(c) `compatibility` 标注 skill 面向的 core 主版本。相比"指向不存在的源码文件"，自包含 + 类型声明核对是更可靠的现实方案。

### 2. 文件结构：新增 `reference/api/`，pattern 文档原地保留

```
skills/raven-use/
├── SKILL.md                       # 重写：自包含工作流入口
└── reference/
    ├── api/                       # 新增：API/运行时教学组
    │   ├── overview.md            # API 表面 + 概念地图 + 核心概念（源自 README/GUIDE）
    │   ├── lifecycle.md           # 构建/请求生命周期、两层 ALS、错误路径（源自 README ARCH + GUIDE）
    │   ├── state-and-di.md        # ScopedState / AppState / RequestState / 内建 state
    │   ├── schema-and-contract.md # withSchema / 校验 / defineContract / 类型方向
    │   ├── plugins.md             # 源自整份 PLUGIN.md
    │   ├── openapi.md             # exportOpenAPI / getOpenAPIDocument / 硬编码行为
    │   └── gotchas.md             # 框架级 gotcha + 运行时反模式（Step 4 自检框架半）
    ├── overview.md                # 保留：分层方法论入口
    ├── layer-responsibilities.md  # 保留
    ├── conventions.md             # 保留
    ├── anti-patterns.md           # 保留：业务分层反模式（Step 4 自检业务半）
    └── runtime-assembly.md        # 保留
```

**为何用 `reference/api/` 子目录而非平铺**：避免新增的框架级 gotcha 文档与既有业务级 `anti-patterns.md` 命名相撞，并把"框架知识"与"分层方法论"两组在物理上分开。**为何 pattern 文档原地保留而不移进 `reference/pattern/`**：现有多个 spec（`pattern-guided-skills`、`core-learning-structure` 等）按 `reference/overview.md`、`reference/layer-responsibilities.md` 等路径引用它们；原地保留可避免大面积改写这些 spec 的路径引用，把本次 spec 改动收敛到真正受影响的几条。

**两类 anti-pattern 文档分工**：`api/gotchas.md` = 框架运行时陷阱（ambient state、hook 作用域、HEAD/404、校验/错误映射、响应 fail-open、scope）；`anti-patterns.md` = 业务分层 smell（entity/repository/contract 边界）。二者区别由 `SKILL.md`（Step 1）显式说明。

### 3. 按源码逐文件验证后重写，纠正文档漂移

迁移不是原样搬运。内容依据对 `packages/core` 全部源码与 `tests/unit/core` 的逐文件验证重写，已记录并纠正的主要漂移：

- `runtime/dispatch-request.ts` 已删除——生命周期入口拆为 `Raven.dispatch`（ALS + onRequest + hono.fetch）与 `make-raven-handler`（命中后流程）。
- 不存在 `openapi/` 目录——OpenAPI 生成在单文件 `app/openapi.ts`。
- 请求 `ValidationError` 不是 `RavenError`，无 `onError` 映射时默认 **500** 而非 400；仅非法 JSON body 才自动 400。
- 响应校验失败 **fail-open**：返回未校验原值（200）+ 通知 `onResponseValidationError`（只读、不可改响应），不调 `onError`。
- 仅经 `registerContractRoute`（带 contract）注册的路由进 OpenAPI；普通 `get/post` 被静默跳过。
- route 冲突按**归一化路径形状**判定（`/orders/:id` 与 `/orders/:orderId` 冲突）。
- `use()` 立即加载、返回 `Promise<void>`、不链式、不触发 `onLoaded`。
- `getOpenAPIDocument()` 只在具体类 `Raven` 上、不在 `RavenInstance` 接口；`exportOpenAPI` 只能调一次。
- `StateSetter` 对 `RequestState` 在 load 期静默 no-op，`internalSet` 缺 store 抛 `ERR_STATE_CANNOT_SET`。

### 4. 补齐前端安全的 `@raven.js/core/contract` 子入口

既有文档（README、pattern reference）一直让 `contract.ts` 从 `@raven.js/core/contract` 导入，但 `package.json` 只声明了 `.` 子路径——该导入在发布态会 `ERR_PACKAGE_PATH_NOT_EXPORTED`。核查确认 `contract/index.ts` 的依赖图仅含 `schema/standard-schema.ts` 与 `schema/standard-json-schema.ts`，**不触达任何运行时**，因此补一个 `./contract` 子入口既修好这条断掉的导入，又兑现了框架"`contract.ts` 前端安全"的核心承诺。tsdown 增加 `contract/index.ts` 构建入口后产出 `dist/contract/index.{mjs,d.mts}`（实测 contract 入口 0.28kB + 共享块 1.61kB，不含 Hono/ALS）。

`contract.ts` 从 `@raven.js/core/contract` 导入 `defineContract` / `InferContract*`；`withSchema` / `registerContractRoute` 等运行时 API 仍从包根 `@raven.js/core` 导入。

## 非目标

- 不改框架运行时行为、公共 API 语义、Hono 引擎接入。
- 不把既有英文 skill 文档翻译为中文：skill 教学文档面向 Agent 即时阅读、代码标识符本就英文，保持英文；仅 openspec 治理产物按工程约定用中文。
- 不引入 skill 安装器（沿用 `npx skills add` + 手动拷贝）。
