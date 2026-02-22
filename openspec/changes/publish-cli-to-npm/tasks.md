## 1. 清理 CLI 源代码

- [x] 1.1 从 packages/cli/index.ts 中移除 self-update 相关代码
- [x] 1.2 从 packages/cli/index.ts 中移除 self-update 命令注册

## 2. 删除旧文件

- [x] 2.1 删除 install.sh
- [x] 2.2 删除 install.ps1

## 3. 创建动态打包脚本

- [x] 3.1 在 packages/cli/scripts/ 下创建创建平台子包的脚本（包含元数据和 README）
- [x] 3.2 创建主包组装脚本（包含元数据和 README）

## 4. 更新 GitHub Actions 工作流

- [x] 4.1 重写 .github/workflows/release-cli.yml 以支持 npm 发布
- [x] 4.2 添加平台特定子包的构建和打包步骤（使用动态脚本）
- [x] 4.3 添加主包的组装和发布步骤（使用动态脚本）
- [x] 4.4 移除 GitHub Releases 相关步骤

## 5. 配置和文档

- [x] 5.1 添加 npm token 配置说明到文档（README）
- [x] 5.2 验证 package.json 中的包名正确为 @raven.js/cli
