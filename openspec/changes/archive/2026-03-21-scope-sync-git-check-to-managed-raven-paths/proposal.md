## Why

当前推荐升级流程要求 Agent 先升级项目内的 `@raven.js/cli`，再执行 `bunx raven sync`。但 `raven sync` 目前要求整个 Git 工作区必须干净，这会把升级 CLI 产生的 `package.json` 与锁文件改动也视为阻塞项，导致推荐流程自相矛盾。

这个问题的根源在于两个约束被混为一谈：`raven-update` 需要干净的仓库基线来保证升级 diff 可归因，而 `raven sync` 真正需要的是避免覆盖或删除 Raven 受管路径中的未提交改动。现在需要把这两个语义拆开。

## What Changes

- 修改 `raven sync` 的 Git 校验语义：不再要求整个 Git 工作区干净，而是只校验本次同步将覆盖、重建或删除的 Raven 受管路径。
- 明确 `raven sync` 的受管路径范围，包括 `<root>/raven.yaml`、`<root>/core/**` 以及同步过程中会删除的 legacy 目录。
- 保持 `raven-update` skill 的仓库基线要求：在升级 CLI 之前，整个 Git 工作区仍必须干净，以保证本次升级 diff 只反映升级本身。
- 更新 CLI 文案、README、skill 文档与规格说明，区分“升级前仓库基线检查”和“sync 前受管路径检查”。
- 补充测试场景，覆盖“仓库其他文件有改动但受管路径干净时 sync 可继续执行”以及“受管路径有未提交改动时 sync 失败”。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `cli-tool`: 调整 `raven sync` 的 Git cleanliness requirement，从“整个工作区干净”收窄为“受管 Raven 路径干净”。
- `raven-update-skill`: 明确 upgrade flow 中 repo-clean baseline 与 `raven sync` 的 managed-path cleanliness 是两个不同层次的约束。

## Impact

- 受影响代码：`packages/cli/index.ts` 中的 Git 校验与 `sync` 执行路径
- 受影响测试：`tests/e2e/cli.test.ts`
- 受影响文档：`README.md`、`packages/cli/README.md`、`packages/install-raven/skills/raven-update/SKILL.md`
- 受影响规格：`openspec/specs/cli-tool/spec.md`、`openspec/specs/raven-update-skill/spec.md`
