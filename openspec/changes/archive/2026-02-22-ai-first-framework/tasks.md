## 1. 准备 AI 模板文件

- [x] 1.1 创建 `packages/cli/templates/skills/raven-install/SKILL.md`
- [x] 1.2 创建 `packages/cli/templates/skills/raven-add/SKILL.md`
- [x] 1.3 创建 `packages/cli/templates/commands/raven/install.md`
- [x] 1.4 创建 `packages/cli/templates/commands/raven/add.md`

## 2. 更新 registry.json

- [x] 2.1 在 `registry.json` 中添加 `ai-skills` 模块定义
- [x] 2.2 配置 AI 资源的文件路径
- [x] 2.3 添加 `fileMapping` 配置，指定目标位置

## 3. 扩展 downloadModule 函数

- [x] 3.1 修改 `downloadModule` 函数签名，增加 `targetSubdir` 参数
- [x] 3.2 实现文件映射逻辑，支持 `fileMapping` 配置
- [x] 3.3 保持向后兼容，现有调用不受影响

## 4. 实现 cmdInit 命令

- [x] 4.1 添加 `cmdInit` 函数到 `packages/cli/index.ts`
- [x] 4.2 实现 AI 资源下载逻辑
- [x] 4.3 添加进度显示（spinner/verbose 模式）
- [x] 4.4 实现已存在检测和确认逻辑

## 5. 更新 cmdUpdate 命令

- [x] 5.1 在 `cmdUpdate` 中添加 AI 资源检测逻辑
- [x] 5.2 实现 AI 资源更新（当 `.claude/` 存在时）
- [x] 5.3 合并框架和 AI 资源的修改文件列表
- [x] 5.4 更新成功提示信息

## 6. 注册 CLI 命令

- [x] 6.1 在 `packages/cli/index.ts` 中注册 `raven init` 命令
- [x] 6.2 添加帮助文本和选项配置
- [x] 6.3 验证命令参数解析

## 7. 测试验证

- [x] 7.1 测试 `raven init` 命令正常安装 AI 资源
- [x] 7.2 测试 `raven update` 同时更新框架和 AI 资源
- [x] 7.3 测试 `--source` 选项从本地加载
- [x] 7.4 测试 `--verbose` 选项输出
