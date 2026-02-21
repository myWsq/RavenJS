## Why

当前 CLI (raven init) 从本地源码目录 RAVEN_SOURCE_DIR 复制代码，不支持用户独立安装。用户需要克隆整个仓库或设置环境变量才能使用 CLI，缺乏 registry 机制来描述模块文件和从远程下载。

## What Changes

- 引入 registry.json 描述各模块的文件路径和外部依赖
- CLI 编译时自动扫描 packages/ 目录生成 registry.json
- 用户目录结构改为可配置的 `<root>/raven/`，默认 `raven/`
- raven.yaml 存储版本信息
- 添加 `raven self-update` 命令更新 CLI 本身
- 统一版本号：CLI 版本 = RavenJS 版本
- 支持并行从 GitHub raw URLs 下载单文件

## Capabilities

### New Capabilities

- `registry-based-install`: 基于 registry.json 从 GitHub 下载模块到用户工作区
- `self-update`: CLI 自我更新能力

### Modified Capabilities

- `cli-tool`: 修改现有 CLI 工具以支持新架构

## Impact

- 修改 `packages/cli/index.ts`
- 新增 `packages/cli/scripts/generate-registry.ts` 编译时脚本
- 用户目录结构变更：src/raven/ → raven/
