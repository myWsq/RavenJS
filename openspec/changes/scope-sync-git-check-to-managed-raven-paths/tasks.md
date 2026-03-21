## 1. 调整 sync 的 Git 检查边界

- [x] 1.1 将 `raven sync` 的 Git 校验从“整个工作区”改为“本次同步会覆盖、重建或删除的 Raven 受管路径”
- [x] 1.2 基于当前 Raven root 状态计算受管检查集合，至少覆盖 `<root>/raven.yaml`、`<root>/core/**` 与将被删除的 legacy 目录
- [x] 1.3 更新 `raven sync` 的错误文案与命令说明，明确失败原因是受管 Raven 路径存在未提交改动

## 2. 收敛升级流程文案

- [x] 2.1 更新 `raven-update` skill，明确整个仓库只在升级开始前要求干净，CLI 升级后的依赖清单改动不会阻塞后续 `sync`
- [x] 2.2 更新根 README 与 CLI README，区分“升级前仓库基线检查”和“sync 前受管路径检查”

## 3. 补齐验证场景

- [x] 3.1 添加 e2e 场景：仓库其他位置存在未提交改动但受管 Raven 路径干净时，`raven sync` 仍可执行
- [x] 3.2 添加 e2e 场景：`<root>/raven.yaml`、`<root>/core/**` 或 legacy 目录存在未提交改动时，`raven sync` 必须失败且不修改 live root
- [x] 3.3 验证 `<root>/` 下 passthrough 普通文件改动不会误阻塞 `sync`，并校验新的失败提示文本
