## 1. 新增更新 skill 与入口文档

- [x] 1.1 新增 `packages/install-raven/skills/raven-update/SKILL.md`，定义 Bun 前置检查、Git 干净工作区检查、CLI 升级、`bunx raven sync`、diff 分析、breaking change 适配与结果汇报流程
- [x] 1.2 更新 `README.md`，把 `raven-update` 加入 AI Skills 列表，并将更新指南改为推荐通过该 skill 执行项目升级

## 2. 强化 sync 安全前置条件

- [x] 2.1 在 `packages/cli/index.ts` 中为 `cmdSync` 增加 Git 工作区检测与干净状态校验，确保失败发生在 staging 之前
- [x] 2.2 在 `packages/cli/index.ts` 中移除 `raven status` 的 `modifiedFiles`、`fileHashes` 和对应的 hash/遍历辅助代码，收敛状态输出模型
- [x] 2.3 更新 `packages/cli/README.md` 与命令说明，明确 `raven sync` 只能在干净 Git 工作区中执行，并说明推荐通过 `raven-update` skill 触发

## 3. 补齐测试与验证

- [x] 3.1 在 `tests/e2e/cli.test.ts` 中新增 `raven sync` 在非 Git 工作区下失败且不修改 `<root>/` 的用例
- [x] 3.2 在 `tests/e2e/cli.test.ts` 中新增 `raven sync` 在脏 Git 工作区下失败且不修改 `<root>/` 的用例
- [x] 3.3 更新 `status` 相关测试断言，确认简化后的输出不再包含无用 diff/hash 字段
- [x] 3.4 运行相关 CLI/skill 验证，确认新 skill 可被 install-raven 分发，且 sync 的新前置条件不破坏现有 clean worktree 场景
