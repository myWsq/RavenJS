## Context

当前 CLI 通过 GitHub Actions 在 5 个平台（linux-x64、linux-arm64、darwin-x64、darwin-arm64、windows-x64）各构建二进制，生成 5 个平台子包 + 1 个动态生成的主包（含 optionalDependencies 与包装脚本），共 6 个 npm 包。RavenJS 生态已全面基于 Bun，用户安装 CLI 时通常会使用 `bun install`，可接受以 Bun 作为 CLI 运行时依赖。

## Goals / Non-Goals

**Goals:**

- 使用 Bun 将 CLI 打包为单文件 JS（`bun build` 不采用 `--compile`），在 Bun 运行时下执行
- 单一 @raven.js/cli 包直接发布到 npm，不再有平台子包与动态主包
- 显著简化 GitHub Actions 发布工作流（单 job、单平台构建）
- 移除 create-main-package、create-platform-package 等脚本

**Non-Goals:**

- 不提供 Node.js 或非 Bun 运行时的支持
- 不兼容无 Bun 环境的直接执行（需显式安装 Bun）

## Decisions

### 1. 构建方式：bun build 打包为 JS，不编译二进制

**决策**: 使用 `bun build ./index.ts --minify --outfile=dist/raven.js`，产出单一 JS 文件，bin 指向该文件，通过 shebang `#!/usr/bin/env bun` 由 Bun 执行。

**备选**:

- `bun build --compile --target=bun-*`: 仍会生成二进制，不符合「不再编译二进制」的要求
- 直接发布源码 `index.ts`: 需要用户具备构建环境，体验差
- 使用 `tsup` 等打包: 增加依赖，Bun 自带 bundler 已足够

### 2. registry.json 处理

**决策**: 保留 generate-registry.ts，在发布前或 CI 中生成 registry.json，将其纳入 packages/cli 的 files，随包一并发布。CLI 运行时通过 `import.meta.dir` 或已知路径加载同目录下的 registry.json。

**备选**:

- 将 registry 内联进打包产物: 增大 bundle 体积，且每次发布需重建
- 远程拉取 registry: 增加网络依赖和复杂度

### 3. package.json bin 与 engines

**决策**:

- `bin.raven` 指向 `./dist/raven.js`
- `engines: { "bun": ">=1.0" }` 声明 Bun 要求
- `peerDependencies` 或文档中说明需安装 Bun

### 4. GitHub Actions 工作流

**决策**: 单 job，在 ubuntu-latest 上 checkout、install、generate-registry、build，然后 `npm publish` packages/cli 目录。tag 触发方式保持不变（如 `v*` 或 `@raven.js/cli@v*`）。

## Risks / Trade-offs

| 风险                               | 缓解                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------ |
| 用户无 Bun 时无法运行              | 在 README 与安装说明中明确需要 Bun；npm 包 metadata 中声明 engines       |
| registry.json 路径在打包后可能变化 | 使用 `import.meta.dir` 或 `path.join` 相对于入口解析，确保与 dist 同目录 |
| 首次 `bun run raven` 可能较慢      | 单文件 bundle 较小，Bun 启动快，影响有限                                 |

## Migration Plan

1. 在 packages/cli 中调整 build 脚本与 package.json
2. 删除 create-main-package.ts、create-platform-package.ts
3. 调整 generate-registry.ts 输出路径（若需），确保 registry.json 被包含在发布文件中
4. 重写 .github/workflows/release-cli.yml
5. 更新 openspec specs
6. 发布新版本后，旧版本 6 包结构逐步弃用，用户升级到新单包版本

## Open Questions

- tag 格式是否继续沿用 `v*` 或改为 `@raven.js/cli@v*`？需与现有 release 流程一致。
