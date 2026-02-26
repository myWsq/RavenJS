## Why

当前 CLI 发布流程需要为 5 个平台分别编译二进制文件、动态生成主包和包装脚本，构建复杂且维护成本高。RavenJS 生态已全面使用 Bun，可将 CLI 改为使用 bun 编译为 target=bun 的打包产物，单一包直接发布到 npm，简化发布流程并减少维护负担。

## What Changes

- **移除**：跨平台二进制编译（linux-x64、linux-arm64、darwin-x64、darwin-arm64、windows-x64）
- **移除**：平台特定子包（@raven.js/cli-linux-x64 等 5 个包）
- **移除**：主包动态生成逻辑（create-main-package.ts、generate-registry.ts 中的主包生成部分）
- **移除**：主包包装脚本（根据平台选择并执行二进制）
- **新增**：使用 `bun build --target=bun` 将 CLI 编译为可在 Bun 运行时执行的打包产物
- **新增**：单一 @raven.js/cli 包直接发布到 npm，bin 指向打包后的入口文件
- **修改**：GitHub Actions 发布工作流简化为单机构建、单包发布

## Capabilities

### New Capabilities

- `cli-bun-publish`: 使用 Bun target 编译 CLI 并直接发布到 npm 的规范

### Modified Capabilities

- `release`: 移除跨平台二进制构建、prebuild 等需求，改为 bun 单目标构建
- `npm-cli-publish`: 移除平台特定子包、主包 optionalDependencies、包装脚本等需求，改为单一包发布

## Impact

- **packages/cli/**: 修改 build 脚本为 bun build --target=bun，调整 package.json 的 bin 和 files
- **.github/workflows/release-cli.yml**: 简化工作流，单 job 构建并发布
- **packages/cli/scripts/**: 移除 create-main-package.ts、create-platform-package.ts，调整 generate-registry.ts（若 registry 仍需要）
- **openspec/specs/release/spec.md**, **openspec/specs/npm-cli-publish/spec.md**: 规格需相应更新
