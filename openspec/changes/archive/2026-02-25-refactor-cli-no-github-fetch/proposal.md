## Why

当前 CLI 在运行时从 GitHub 拉取模块代码，导致网络依赖和潜在的版本漂移问题。同时 `registry.json` 混入了 AI 配置逻辑，职责不清晰。通过在构建时将源码内嵌到 `dist/source/` 目录，并清理 registry 的职责范围，可以让 CLI 做到离线可用、结构清晰。

## What Changes

- **移除 `registry.json` 中的 `ai` 字段**：registry 只保留 `version` 和 `modules`，不再包含 AI 相关配置
- **移除运行时 GitHub 拉取逻辑**：删除 `GITHUB_REPO`、`GITHUB_RAW_URL` 常量和 `downloadFile` 函数
- **构建时内嵌源码**：`build.ts` 在构建时将 `modules/` 下所有模块文件复制到 `dist/source/<module-name>/` 目录
- **CLI 从内嵌 source 读取**：`downloadModule` 改为从 `__dirname/source/` 读取文件，不再网络请求
- **移除 `--source` 选项或降为 dev-only override**：生产路径直接使用内嵌 source，`--source` 仅在开发/测试时使用
- **移除 `RegistryAi` 接口和 `scanAi()` 函数**：build.ts 不再扫描 `packages/ai`

## Capabilities

### New Capabilities

- `cli-embedded-source`: 构建时将模块源码复制进 `dist/source/`，CLI 运行时从内嵌路径加载模块文件，无需网络访问

### Modified Capabilities

- `cli-tool`: Registry 类型定义和加载逻辑变更（移除 `ai` 字段），模块安装逻辑改为读取内嵌 source 而非 GitHub 下载

## Impact

- `packages/cli/index.ts`：移除 GitHub 相关常量和网络下载逻辑，`downloadModule` 改为本地读取
- `packages/cli/scripts/build.ts`：移除 `scanAi()`，新增复制模块文件到 `dist/source/` 的逻辑
- `registry.json` 结构变更（去除 `ai` 字段）
- `tests/e2e/cli.test.ts`：删除依赖 `--source` 绕过 GitHub 的测试用例或适配新逻辑
