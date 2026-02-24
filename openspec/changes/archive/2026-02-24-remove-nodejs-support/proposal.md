## Why

RavenJS 目前同时支持 Bun 和 Node.js 运行时，增加了维护成本和代码复杂度。将 ravenjs 定位为 **Bun-only** 可以简化架构、减少运行时适配层、更好地利用 Bun 原生 API 和高性能特性，同时与项目的技术栈定位（Bun + TypeScript）保持一致。

## What Changes

- 移除 Node.js 运行时支持，ravenjs 仅支持 Bun
- **BREAKING**: 删除 `NodeAdapter` 及运行时检测逻辑，框架启动时仅使用 `BunAdapter`
- **BREAKING**: 移除 `test:node` 脚本及对 vitest 的 Node.js 环境测试
- 移除 `@ravenjs/testing` 包，测试直接从 `bun:test` 导入
- 将 `node:` 模块用法（如 CLI 脚本中的 `node:fs`、`node:path`）迁移至 Bun 原生 API 或 Bun 兼容用法
- 更新 `package.json`：移除 `@types/node`、`test:node`、vitest 等 Node 相关依赖与脚本
- 更新 `tsconfig.json`：移除 `node` 类型声明
- 更新 CLI 发布流程：移除 `#!/usr/bin/env node` 等 Node.js 入口包装（如有）

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `core-framework`: 移除「运行时抽象层」中与 Node.js 相关的需求；删除 Node.js 环境检测与 `node:http` 适配；框架仅需在 Bun 下启动并工作

## Impact

- **受影响代码**：`modules/core/index.ts`（NodeAdapter、listen 运行时选择）、`packages/cli/*`、`packages/cli/scripts/*`、`scripts/release.ts`
- **受影响配置**：`package.json`、`tsconfig.json`
- **API 变更**：`NodeAdapter` 不再导出；`listen()` 不再支持 Node.js 环境
- **依赖变更**：移除或降级 `@types/node`、`vitest`
- **文档与 README**：需更新为 Bun-only 说明
