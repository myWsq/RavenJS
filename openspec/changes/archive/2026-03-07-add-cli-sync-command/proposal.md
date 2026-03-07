## Why

当前 CLI 只有增量安装与状态查询能力，无法把本地 `raven/` 下已安装模块重新收敛到 registry 的真实内容。仅做覆盖会留下本地历史残留文件，而当 registry 删除某个模块时，本地也不会自动清理，导致用户代码与 registry 长期漂移，升级结果不可预测。

我们需要一个 `raven sync` 命令，把“已安装过的模块集合”重新对齐到当前 registry，并且以原子方式提交结果，避免同步过程中只改了一半、项目进入中间态。

## What Changes

- 新增 `raven sync` 命令，基于当前 registry 对本地已安装的 RavenJS 模块做一次全量收敛。
- `sync` 对每个已安装模块执行“精确镜像”更新，而不是仅覆盖同名文件；凡是不在 registry 清单中的本地残留文件都必须被删除。
- 当本地存在的已安装模块在 registry 中已被移除时，`sync` 必须删除该模块目录，确保本地安装集合与 registry 一致。
- `sync` 采用临时目录构建与一次性切换的方式实现原子提交；任一模块构建失败时，本地 `raven/` 保持原状。
- CLI 帮助文案、README 与测试需要覆盖 `sync` 的行为、失败回滚和删除场景。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `cli-tool`: 增加 `raven sync` 命令，并定义“模块内容精确对齐 registry + 删除已移除模块 + 整体原子提交”的行为要求。

## Impact

- 影响 `packages/cli/index.ts` 的命令定义、registry 对齐逻辑和文件系统写入流程。
- 需要新增或调整 CLI 测试，覆盖残留文件清理、模块删除、失败回滚和输出摘要。
- 需要更新 `packages/cli/README.md` 与命令帮助文本，说明 `sync` 与 `add` 的行为差异。
