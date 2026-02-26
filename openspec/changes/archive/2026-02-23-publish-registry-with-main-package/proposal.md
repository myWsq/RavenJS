## Why

当前 registry.json 被内联到 raven 二进制文件中，每次更新 registry 都需要重新编译和发布整个二进制文件。既然现在 CLI 主包是发布时动态生成的，我们可以将 registry.json 和主包一起发布，这样更灵活。

## What Changes

- **新增**：在主包的 wrapper 脚本所在的同一层级添加 registry.json 文件
- **修改**：修改 wrapper 脚本，在运行二进制文件时通过环境变量传入 registry.json 的路径
- **修改**：修改 raven cli 的入口文件，使其在开始运行时从环境变量指定的路径加载 registry
- **移除**：registry.json 不再需要内联到二进制文件中

## Capabilities

### Modified Capabilities

- `npm-cli-publish`: 主包现在会包含并发布 registry.json 文件
- `cli-tool`: CLI 现在从外部文件加载 registry，而不是内联数据

## Impact

- **packages/cli/scripts/create-main-package.ts**: 需要修改，在主包中包含 registry.json 文件
- **packages/cli/index.ts**: 需要修改 registry 的加载方式
