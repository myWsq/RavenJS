## 1. 清理 build.ts

- [x] 1.1 移除 `AI_PACKAGE_DIR` 常量、`RegistryAi` / `Registry.ai` 相关类型定义
- [x] 1.2 删除 `scanAi()` 函数
- [x] 1.3 修改 `generateRegistry()`：不再调用 `scanAi()`，生成的 registry 只含 `{ version, modules }`
- [x] 1.4 新增 `copyModuleSources()` 函数：将 `modules/<name>/` 下 git-tracked 文件（排除 `package.json`）复制到 `dist/source/<name>/`
- [x] 1.5 在 `main()` 中将 `copyModuleSources()` 加到 `--registry-only` 之后、`Bun.build()` 之前的步骤中

## 2. 清理 index.ts（CLI 运行时）

- [x] 2.1 删除 `GITHUB_REPO`、`GITHUB_RAW_URL` 常量
- [x] 2.2 删除 `RegistryAi` 接口，从 `Registry` 接口中移除 `ai` 字段
- [x] 2.3 删除 `CLIOptions.source`、`getSource()` 函数、`resolveSourcePath()` 函数
- [x] 2.4 从 CLI 的 `--source` 选项声明中删除该选项
- [x] 2.5 删除 `downloadFile()` 函数
- [x] 2.6 重构 `downloadModule()` 为 `installModule()`：从 `join(__dirname, "source", moduleName, file)` 读取文件
- [x] 2.7 在 `getStatus()` 中移除 GitHub API 拉取 `latestVersion` 的逻辑
- [x] 2.8 更新 `loadRegistry()` 中的注释，去除对 `--source` 的引用

## 3. 验证构建产物

- [x] 3.1 运行 `bun run build` 验证无编译错误
- [x] 3.2 检查 `dist/source/` 目录存在且包含各模块文件
- [x] 3.3 检查 `dist/registry.json` 中不含 `ai` 字段

## 4. 更新 E2E 测试

- [x] 4.1 移除 `tests/e2e/cli.test.ts` 中使用 `--source` 选项的测试用例或更新为不依赖 `--source`
- [x] 4.2 确保 E2E 测试通过（`bun test tests/e2e/cli.test.ts`）
