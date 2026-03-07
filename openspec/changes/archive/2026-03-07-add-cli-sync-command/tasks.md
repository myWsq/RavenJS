## 1. Sync 核心构建能力

- [x] 1.1 增加 helper：枚举 `<root>/` 下已安装模块目录，区分 registry 仍存在的模块与已被移除的模块，并计算当前 `dependsOn` 依赖闭包
- [x] 1.2 重构模块复制逻辑，使 `add` 与 `sync` 都能把模块内容写入任意目标 root，并统一收集写入文件列表
- [x] 1.3 实现 staging root 构建流程：重写 `raven.yaml`、保留非模块顶层文件、按 registry 重新生成目标模块目录
- [x] 1.4 实现 backup/swap/rollback 清理逻辑，确保 staging 失败或提交失败时恢复原始 root

## 2. CLI 命令接入

- [x] 2.1 在 `packages/cli/index.ts` 中实现 `cmdSync`，包含 root 校验、registry 加载、staging 构建、事务提交和错误回滚
- [x] 2.2 注册 `raven sync` 命令，复用现有全局选项，并输出 JSON 摘要加最终 `raven status` 结果
- [x] 2.3 更新 `packages/cli/README.md` 与命令帮助文案，说明 `sync` 的精确对齐、删除已移除模块和原子性语义

## 3. 验证与回归测试

- [x] 3.1 为 `raven sync` 增加 e2e 测试：模块目录存在历史残留文件时，sync 后只保留 registry 中声明的文件
- [x] 3.2 增加 e2e 测试：测试 registry 删除模块后，sync 会删除本地对应模块目录
- [x] 3.3 增加 e2e 测试：某个已安装模块新增 `dependsOn` 后，sync 会自动补齐缺失依赖模块
- [x] 3.4 增加失败路径测试：staging 失败或最终切换失败时，原始 root 内容保持不变
