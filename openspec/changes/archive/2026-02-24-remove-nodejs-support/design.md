## Context

RavenJS 当前通过 `ServerAdapter` 抽象层支持 Bun 与 Node.js 双运行时：`listen()` 中根据 `typeof Bun !== "undefined"` 选择 `BunAdapter` 或 `NodeAdapter`。NodeAdapter 使用 `node:http` 创建服务器，将 IncomingMessage/ServerResponse 转换为 Web Request/Response。此外，CLI 发布流程中的 `create-main-package.ts` 会生成以 `#!/usr/bin/env node` 为 shebang 的包装脚本，用于 npm 安装后通过 Node 启动平台特定的 Bun 二进制。项目还依赖 `@types/node`、vitest 及 `test:node` 脚本以在 Node 环境跑测试。

## Goals / Non-Goals

**Goals:**
- 移除 Node.js 作为 ravenjs 的运行环境支持
- 删除 NodeAdapter 及 listen 中的运行时分支，仅保留 BunAdapter
- 将 CLI、脚本中的 `node:` 导入迁移为 Bun 原生 API 或 Bun 兼容用法
- 清理 package.json、tsconfig.json 中与 Node 相关的配置与依赖
- 将 CLI 发布流程中的 Node 包装脚本改为 Bun 可执行脚本

**Non-Goals:**
- 不改变核心框架的 HTTP API、路由、状态管理等业务行为
- 不引入新的外部依赖
- 不提供 Node 到 Bun 的迁移工具或兼容层

## Decisions

### D1: 移除 NodeAdapter，listen 仅使用 BunAdapter

**决定**：删除 `NodeAdapter` 类及 `IncomingMessage`/`ServerResponse` 类型导入，`listen()` 直接 `new BunAdapter()`，不再做 `isBun` 检测。

**备选**：保留 NodeAdapter 但标记为 deprecated → 拒绝，与「Bun-only」目标矛盾。

### D2: 保留 node:async_hooks 用于 AsyncLocalStorage

**决定**：继续使用 `import { AsyncLocalStorage } from "node:async_hooks"`。Bun 对 Node API 有兼容层，且当前无等效的 Bun 原生 API。这不影响「Node 作为运行时」的移除，仅表示依赖 Bun 的 Node 兼容层。

**备选**：改用 Bun 自有实现 → 若存在则优先；目前保持现状以降低改动面。

### D3: CLI / 脚本中的 node:fs、node:path 迁移策略

**决定**：将 `node:fs/promises`、`node:path` 替换为 Bun 原生 API：`import { mkdir, rm, readdir, stat, writeFile, chmod, copyFile } from "fs/promises"` 在 Bun 中可用，或使用 `Bun.write`、`Bun.file` 等。`join` 可使用 `path.join`（Bun 兼容）或 `import path from "path"`。优先使用 Bun 文档推荐的 API，以保证 Bun-only 语义一致。

### D4: CLI 发布时的 raven 包装脚本改为 Bun 可执行

**决定**：将 `create-main-package.ts` 生成的包装脚本从 `#!/usr/bin/env node` + CommonJS 改为 `#!/usr/bin/env bun` + ESM/TS 或内联 Bun 脚本，使用 `Bun.spawn` 等 API 调用平台二进制。安装方式文档更新为 `bun install -g @raven.js/cli`。

**备选**：保留 Node 包装以兼容 `npm install -g` 用户 → 拒绝，与 Bun-only 定位冲突。

### D5: 移除 vitest 与 test:node

**决定**：删除 `test:node` 脚本及 vitest 依赖，全部测试统一使用 `bun test`。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 现有 Node 用户无法直接使用 ravenjs | 在 README 与 CHANGELOG 中明确说明 Bun-only，并建议使用 Bun 运行 |
| CLI 用户习惯 `npm install -g` | 文档强调 `bun install -g`，并提供安装说明 |
| node:async_hooks 在 Bun 中长期兼容性 | 目前为稳定用法；若有变化，可后续迁移到 Bun 自有 API |

## Migration Plan

1. 实现代码变更（按 tasks 执行）
2. 运行 `bun test` 验证
3. 发布新 major/minor 版本，在 CHANGELOG 中标注 BREAKING
4. 无需回滚策略：移除后即生效，旧版本仍可在 Node 下运行（若有需要可继续使用旧版）

## Open Questions

- 是否需要添加 `package.json` 的 `engines: { "bun": ">=1.0" }` 以显式声明 Bun 依赖？
