## 1. 修改 create-main-package.ts

- [x] 1.1 从 packages/cli/registry.json 复制 registry.json 到主包根目录
- [x] 1.2 在 package.json 的 files 数组中添加 registry.json
- [x] 1.3 修改 wrapper 脚本，通过 \_\_dirname 查找 registry.json
- [x] 1.4 修改 wrapper 脚本，找不到 registry.json 时直接报错
- [x] 1.5 修改 wrapper 脚本，设置 RAVEN_REGISTRY_PATH 环境变量

## 2. 修改 packages/cli/index.ts

- [x] 2.1 从 process.env.RAVEN_REGISTRY_PATH 加载 registry
- [x] 2.2 移除内联的 registry.json 导入

## 3. 测试

- [x] 3.1 测试 create-main-package.ts 能正确生成包含 registry.json 的主包
- [x] 3.2 测试 wrapper 脚本能正确通过 \_\_dirname 查找 registry.json
- [x] 3.3 测试 wrapper 脚本找不到 registry.json 时会报错
- [x] 3.4 测试 CLI 能从环境变量加载 registry
