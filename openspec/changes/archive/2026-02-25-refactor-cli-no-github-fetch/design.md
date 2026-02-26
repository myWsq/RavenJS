## Context

当前 CLI 有两种模块安装模式：

1. **默认模式**：从 GitHub raw URL 拉取文件 (`https://raw.githubusercontent.com/myWsq/RavenJS/v<version>/modules/<name>/<file>`)
2. **本地模式**：通过 `--source <path>` 指定本地目录读取文件

`registry.json` 包含三个顶层字段：`version`、`modules`、`ai`，其中 `ai` 存储 Claude 技能的路径映射，由 `packages/ai/package.json` 中的 `claude` 字段驱动，与模块安装逻辑耦合。

构建脚本 `packages/cli/scripts/build.ts` 在生成 registry 时会同时 `scanModules()` 和 `scanAi()`，混合了两个无关的职责。

**问题**：

- 运行时依赖网络，离线环境无法正常工作
- registry.json 的 `ai` 字段与 CLI 模块安装职责无关，增加了维护负担
- `--source` 选项本意是绑过 GitHub 用于开发/测试，实际上是对"GitHub 是唯一来源"这一设计缺陷的补丁

## Goals / Non-Goals

**Goals:**

- 构建时将所有模块源码内嵌至 `dist/source/`，CLI 离线可用
- `registry.json` 只包含 `version` 和 `modules`，不再包含 `ai`
- 移除运行时 GitHub 网络请求，模块安装完全读取本地内嵌文件
- build.ts 职责单一：生成 registry + 复制源码 + 编译 CLI

**Non-Goals:**

- 不修改 CLI 命令的对外 API（`init`、`add`、`update`、`status`、`self-update`、`guide` 行为不变）
- 不修改模块目录结构和 registry modules 字段格式
- 不影响 `packages/ai` 的内容和 `install-raven` 工具

## Decisions

### 决策 1：内嵌 source 目录而非运行时下载

**选择**：构建时将 `modules/` 下所有模块文件复制到 `dist/source/<module-name>/`，CLI 通过 `join(__dirname, "source", moduleName, file)` 读取。

**备选方案**：

- 继续 GitHub 下载，但固化到当前版本 tag → 仍有网络依赖，无法离线
- 将模块代码直接打包进 JS bundle → 需要特殊打包处理，且 Bun.build 不适合原样保留源文件文本

**理由**：复制文件到 `dist/source/` 是最直接的方案，与 CLI 当前的 `copyLocalFile` 逻辑天然兼容，无需额外的文件格式转换。

### 决策 2：完全移除 `ai` 字段，而非可选化

**选择**：从 `Registry` 接口、`registry.json` 结构、`build.ts` 中彻底删除 `ai` 相关代码。

**备选方案**：保留 `ai` 字段但标记为 optional → 造成"是否存在"的歧义，维护成本不降

**理由**：CLI (`@raven.js/cli`) 完全不使用 `registry.ai`，`install-raven` 有独立的 AI 资源管理机制，两者无需共享 registry。

### 决策 3：移除 `--source` CLI 选项

**选择**：删除 `--source` 选项和 `getSource()`/`resolveSourcePath()` 函数。

**备选方案**：保留 `--source` 作为 override，内嵌 source 为 fallback → 增加代码复杂度

**理由**：引入内嵌 source 后，所有安装路径均来自 `dist/source/`，开发时直接 `bun run build` 重新构建即可更新，`--source` 失去存在价值。

### 决策 4：build.ts 新增 `copyModuleSources()` 步骤

**实现顺序**：

1. `generateRegistry()` → 生成 `dist/registry.json` 和 `registry.json`
2. `copyModuleSources()` → 将 `modules/` 复制到 `dist/source/`（仅复制 git tracked 文件，排除 `package.json`）
3. `Bun.build()` → 编译 CLI

## Risks / Trade-offs

- **[Dist 体积增大]** → 内嵌所有模块源码会使 `dist/` 目录增大，但模块文件通常是 TypeScript 源文件，体积可接受
- **[构建时依赖 git tracked 文件]** → 新建模块文件需要先 `git add` 才会被 `getGitTrackedFiles` 捡到；这个约束在现有构建中已存在，无新增风险
- **[离线安装不含最新 git 提交]** → 用户使用的模块版本与 CLI 版本绑定，这正是目标行为（版本一致性保证）
- **[E2E 测试需要调整]** → 现有测试通过 `--source` 指向 fixture，需改为构建后测试或调整 fixture 机制

## Migration Plan

1. 修改 `packages/cli/scripts/build.ts`：移除 `scanAi()`，新增 `copyModuleSources()`
2. 修改 `packages/cli/index.ts`：
   - 移除 `GITHUB_REPO`、`GITHUB_RAW_URL`、`downloadFile`、`RegistryAi`
   - 移除 `--source` 选项、`getSource()`、`resolveSourcePath()`
   - `downloadModule` → 改名为 `installModule`，读取 `join(__dirname, "source", ...)`
3. 更新 `Registry` 接口，移除 `ai` 字段
4. 更新 E2E 测试，移除 `--source` 相关 fixture
5. 运行 `bun run build` 验证构建产物包含 `dist/source/`
6. 运行 E2E 测试验证安装流程

**回滚**：若有问题，git revert 相关提交即可，`dist/source/` 目录可直接删除。

## Open Questions

无
