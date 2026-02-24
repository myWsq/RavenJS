## 1. Core Framework 移除 Node 支持

- [x] 1.1 删除 `modules/core/index.ts` 中的 `NodeAdapter` 类及 `IncomingMessage`、`ServerResponse` 类型导入
- [x] 1.2 修改 `listen()` 方法：移除 `isBun` 检测，直接使用 `new BunAdapter()`
- [x] 1.3 更新 `ServerAdapter` 接口注释：移除 Node.js 相关描述
- [x] 1.4 从 core 的 Public API 导出中移除 `NodeAdapter`（如有显式导出）

## 2. 配置与依赖清理

- [x] 2.1 从 `package.json` 移除 `@types/node`、`vitest` 及 `test:node` 脚本
- [x] 2.2 更新 `tsconfig.json`：将 `"types": ["bun", "node"]` 改为 `"types": ["bun"]`
- [x] 2.3 在 `package.json` 中添加 `engines: { "bun": ">=1.0" }`（可选，按 design 决策）

## 3. CLI 与脚本迁移

- [x] 3.1 将 `packages/cli/index.ts` 中的 `node:fs/promises`、`node:path` 迁移为 Bun API 或 Bun 兼容用法
- [x] 3.2 将 `packages/cli/scripts/create-main-package.ts` 中的 `node:fs/promises`、`node:path` 迁移为 Bun API
- [x] 3.3 将 `packages/cli/scripts/create-platform-package.ts` 中的 `node:fs/promises`、`node:path` 迁移为 Bun API
- [x] 3.4 将 `scripts/release.ts` 中的 `node:fs/promises`、`node:path` 迁移为 Bun API
- [x] 3.5 修改 `create-main-package.ts` 生成的 raven 包装脚本：从 `#!/usr/bin/env node` + CommonJS 改为 `#!/usr/bin/env bun` + Bun 可执行脚本

## 4. 移除 @ravenjs/testing 包

- [x] 4.1 删除 `packages/testing` 包，测试文件改为从 `bun:test` 直接导入
- [x] 4.2 更新 `openspec/specs/development/spec.md`：移除 @ravenjs/testing 与 Vitest 相关需求

## 5. 验证

- [x] 5.1 运行 `bun test` 确保所有测试通过
- [x] 5.2 运行 `bun run benchmark` 确保基准测试正常
