## 1. 拆除模块分发基础设施

- [x] 1.1 调整仓库元数据与脚本，移除 `modules/sql` 作为官方模块的地位，并清理 `Available Modules` / `generate-modules-table` 等模块化叙事入口
- [x] 1.2 重构 CLI 构建脚本与内嵌源码清单，删除基于 registry modules / `dependsOn` 的扫描逻辑，改为固定打包 core 与示例资产
- [x] 1.3 删除 `raven add` 相关 CLI 命令、状态结构与错误分支，并清理依赖该命令的帮助文案与输出约定

## 2. 实现单一 core 的 CLI 工作流

- [x] 2.1 修改 `raven init`，使其直接安装 `<root>/core/` 与受管理示例目录，并保持现有的 spinner / verbose 行为
- [x] 2.2 修改 `raven status` 为单一 core 输出模型，返回 `version`、`language`、`installed`、`rootDir`、`installDir`
- [x] 2.3 修改 `raven sync`，使其重建受管理的 core 与示例目录、清理遗留模块目录，并保持原子回滚与 Git worktree 保护

## 3. 将 SQL 降级为教学示例并收敛技能工作流

- [x] 3.1 将现有 `sql` 模块迁移为 `<root>/examples/sql-plugin/` 对应的示例资产，并移除其作为 workspace 模块与 CLI 可安装项的身份
- [x] 3.2 更新 `README.md`、core 的 `GUIDE.md` / `README.md` / pattern 文档，改写对外叙事为“单一 core + plugin 示例”，并显式链接 SQL 示例
- [x] 3.3 更新 install-raven 分发的 skills，移除 `raven-add`，并把 `raven-setup`、`raven-learn`、`raven-use`、`raven-update` 改为 core-only 流程

## 4. 对齐测试与验证

- [x] 4.1 更新 CLI 构建、状态与 E2E 测试，覆盖单一 core 的 `init` / `status` / `sync` 行为
- [x] 4.2 增加回归覆盖：验证 `raven sync` 会清理历史 `sql` 模块目录，并安装 / 更新 SQL plugin 示例目录
- [x] 4.3 运行相关测试与 OpenSpec 校验，确认 proposal / design / specs / tasks 与实现行为一致
