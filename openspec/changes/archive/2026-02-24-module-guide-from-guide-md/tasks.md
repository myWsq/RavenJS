## 1. Registry 生成校验

- [x] 1.1 在 `packages/cli/scripts/build.ts` 的 scanModules 中，对每个有效模块校验 `GUIDE.md` 存在性，缺则 console.error + process.exit(1)
- [x] 1.2 确保 GUIDE.md 被 git ls-files 包含（未被 EXCLUDED_MODULE_FILES 排除），以便 add 时拷贝

## 2. CLI guide 命令

- [x] 2.1 修改 `packages/cli/index.ts` 的 cmdGuide：从 `<ravenDir>/<module>/GUIDE.md` 读取并原样输出
- [x] 2.2 移除 cmdGuide 中 README 与 collectCodeFiles 相关逻辑
- [x] 2.3 当 GUIDE.md 不存在时，cmdGuide 报错并退出

## 3. 模块 GUIDE.md 补全

- [x] 3.1 为 `modules/core` 补全 GUIDE.md 内容（说明 AI Agent 如何学习 core 模块）
- [x] 3.2 为 `modules/jtd-validator` 创建并写入 GUIDE.md

## 4. 测试与技能

- [x] 4.1 更新 `tests/e2e/cli.test.ts`：Guide 命令测试期望 GUIDE.md 内容，移除对 `<readme>`/`<code>` 标签的断言
- [x] 4.2 检查 `packages/ai/raven-learn/skill.md` 等技能，确认与新输出格式兼容
