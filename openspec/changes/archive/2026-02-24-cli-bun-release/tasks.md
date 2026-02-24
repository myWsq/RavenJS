## 1. CLI 包构建与配置

- [x] 1.1 修改 packages/cli/package.json：将 build 脚本改为 `bun build ./index.ts --minify --outfile=dist/raven.js`
- [x] 1.2 修改 packages/cli/package.json：bin 指向 `./dist/raven.js`，files 包含 dist 与 registry.json
- [x] 1.3 修改 packages/cli/package.json：添加 `engines: { "bun": ">=1.0" }`
- [x] 1.4 确保构建产物 dist/raven.js 包含 shebang `#!/usr/bin/env bun`（bun build 可自动注入或需手动添加）

## 2. 移除废弃脚本

- [x] 2.1 删除 packages/cli/scripts/create-main-package.ts
- [x] 2.2 删除 packages/cli/scripts/create-platform-package.ts
- [x] 2.3 确认 generate-registry.ts 输出到 packages/cli/registry.json 且被 files 包含，如需则调整

## 3. GitHub Actions 工作流

- [x] 3.1 重写 .github/workflows/release-cli.yml：移除 matrix 构建，改为单 job
- [x] 3.2 工作流步骤：checkout → setup Bun → install → generate-registry → build CLI → npm publish packages/cli
- [x] 3.3 保留 tag 触发逻辑（v* 或 @raven.js/cli@v*）与 NPM_TOKEN 认证
- [x] 3.4 移除 platform package 的 download/merge 与多包 publish 逻辑

## 4. OpenSpec 规格更新

- [x] 4.1 更新 openspec/specs/release/spec.md：应用 delta 变更
- [x] 4.2 更新 openspec/specs/npm-cli-publish/spec.md：应用 delta 变更
- [x] 4.3 创建 openspec/specs/cli-bun-publish/spec.md：从 delta 合并为新主 spec
