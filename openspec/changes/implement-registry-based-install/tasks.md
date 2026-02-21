## 1. 目录结构重组

- [x] 1.1 创建 `modules/` 目录（与 `packages/` 并列）
- [x] 1.2 将 core 从 packages/ 移动到 modules/
- [x] 1.3 将 jtd-validator 从 packages/ 移动到 modules/
- [x] 1.4 在各模块 package.json 添加 `dist` 字段

## 2. Registry 生成脚本

- [x] 2.1 创建 `packages/cli/scripts/generate-registry.ts`
- [x] 2.2 扫描 modules/*/package.json，读取 dist 字段
- [x] 2.3 读取 dependencies 字段作为外部依赖
- [x] 2.4 生成 registry.json 结构（version, modules[].files, modules[].dependencies）

## 3. CLI 架构改造

- [x] 3.1 修改 packages/cli/index.ts 支持可配置的 ravenRoot
- [x] 3.2 实现从 registry.json 读取模块信息
- [x] 3.3 实现并行文件下载（使用 Promise.all）
- [x] 3.4 创建 raven.yaml 写入版本号
- [x] 3.5 外部依赖安装（bun add）

## 4. 命令更新

- [x] 4.1 修改 `raven init` 使用新目录结构（raven/ 而非 src/raven/）
- [x] 4.2 修改 `raven add` 使用新目录结构
- [x] 4.3 修改 `raven update` 使用 registry 下载
- [x] 4.4 添加 `raven self-update` 命令
- [x] 4.5 更新 `--raven-root` 选项

## 5. SKILL 和文档

- [x] 5.1 更新 SKILL.md 路径引用（src/raven → raven）
- [x] 5.2 更新 README.md 或用户文档

## 6. 构建集成

- [x] 6.1 修改 package.json 添加 generate-registry 脚本到 build 流程
- [x] 6.2 测试完整构建流程
