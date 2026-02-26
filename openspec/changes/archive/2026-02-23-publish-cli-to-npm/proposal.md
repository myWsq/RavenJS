## Why

当前 @raven.js/cli 通过 GitHub Releases 和独立的安装脚本发布，用户体验不够友好。将其发布到 npm 可以利用 npm 生态系统的便利性，用户只需 `npm install -g @raven.js/cli` 即可安装，同时利用 npm 的平台特定依赖机制自动适配不同操作系统和架构。

## What Changes

- **新增**：将 @raven.js/cli 发布到 npm registry
- **新增**：创建平台特定的子包 (@raven.js/cli-linux-x64, @raven.js/cli-linux-arm64, @raven.js/cli-darwin-x64, @raven.js/cli-darwin-arm64, @raven.js/cli-windows-x64)
- **新增**：主包包含包装脚本，自动找到并执行对应平台的二进制文件
- **新增**：更新 GitHub Actions 工作流，构建和发布 npm 包
- **移除**：self-update 命令（npm 包通过 `npm update` 更新）
- **移除**：install.sh 和 install.ps1 安装脚本
- **移除**：GitHub Releases 发布步骤

## Capabilities

### New Capabilities

- `npm-cli-publish`: 通过 npm 发布 CLI，包含平台特定子包机制

### Modified Capabilities

- `release`: 现有的发布规范需要更新，从 GitHub Releases 切换到 npm 发布

## Impact

- **packages/cli/**: 需要移除 self-update 相关代码，添加主包包装脚本
- **.github/workflows/release-cli.yml**: 完全重写工作流
- **install.sh, install.ps1**: 删除这两个文件
