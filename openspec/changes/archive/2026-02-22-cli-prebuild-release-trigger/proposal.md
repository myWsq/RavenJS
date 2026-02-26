## Why

当前 CLI 的 prebuild 版本号是硬编码，未与 GitHub Release 的版本联动，导致发布流程容易出错且需要人工同步。由于 RavenJS 与 CLI 共用版本号，触发条件也不应复杂化，应该只基于 v{x.x.x} 统一触发。

## What Changes

- GitHub Release workflow 触发条件改为仅匹配 v{x.x.x} 标签
- CLI prebuild 版本号改为从 Release tag 读取，去除固定写死版本
- 统一 RavenJS 与 CLI 的版本联动逻辑，确保一次发布全流程一致

## Capabilities

### New Capabilities

- `cli-prebuild-release-trigger`: CLI 预构建与 GitHub Release 标签的联动与触发规则

### Modified Capabilities

-

## Impact

- GitHub Actions: release workflow 触发与版本传递逻辑
- CLI package prebuild 流程
- 发布流程文档与可能的版本发布脚本
