## Context

当前升级协议里有两个不同层次的 Git 约束：

- `raven-update` 需要在开始前拿到一个干净的仓库基线，这样后续 `bun add -d @raven.js/cli@latest`、`bunx raven sync` 与用户代码适配产生的 diff 都可以归因到同一次升级。
- `raven sync` 需要保证自己不会覆盖或删除用户在 Raven 受管资产上的未提交改动。

现在 CLI 实现把这两件事合并成了同一个检查：`raven sync` 直接对整个 Git 工作区执行 `git status --porcelain`。这使得推荐升级流程形成死锁：一旦 CLI 升级先修改了 `package.json` 或锁文件，后续 `sync` 就会因为整个仓库不再干净而失败。

从当前 `sync` 实现看，它真正会重建的是 `<root>/raven.yaml` 与 `<root>/core/**`，并会删除 `<root>/` 下除 `core` 之外的 legacy 目录；根目录下的普通 passthrough 文件会被原样复制，不会被主动改写。因此，`sync` 的安全边界应与受管路径一致，而不是与整个仓库一致。

## Goals / Non-Goals

**Goals:**

- 解除 `raven-update` 的推荐升级流程与 `raven sync` 全仓库 clean 检查之间的自相矛盾。
- 为 `raven sync` 定义与实际写入范围一致的 Git 安全边界。
- 明确区分“升级开始前的仓库基线检查”和“sync 执行前的受管路径检查”。
- 让规格、测试与文档围绕同一套语义收敛。

**Non-Goals:**

- 不新增 `raven update`、`raven diff` 或新的 CLI flag。
- 不让 CLI 自动 stash、commit 或恢复用户改动。
- 不改变 `sync` 的 staging / rollback 事务式提交流程。
- 不改变根目录 passthrough 文件的保留策略。

## Decisions

### 1. 采用双层 Git cleanliness 模型

- `raven-update` 负责“仓库基线”语义：在执行任何升级动作前，要求整个 Git 工作区干净。
- `raven sync` 负责“受管资产保护”语义：只检查本次同步会覆盖、重建或删除的 Raven 受管路径是否存在未提交改动。

这样分层后，升级流程可以是：

1. 仓库起点干净。
2. `bun add -d @raven.js/cli@latest` 修改依赖清单与锁文件。
3. `bunx raven sync` 只检查 Raven 受管路径，因此不会被步骤 2 阻塞。
4. Agent 基于同一条 Git diff 分析升级影响。

**Alternatives considered**

- 保持整个 repo clean 检查：实现最简单，但会继续阻塞推荐升级流程。
- 只在 skill 中放宽，不改 CLI：用户直接运行 `bunx raven sync` 时仍会遇到相同死锁。

### 2. `raven sync` 的检查范围收敛到 `<root>/` 内的受管路径

本次变更将 `sync` 的 Git 检查范围定义为：

- `<root>/raven.yaml`
- `<root>/core/**`
- `<root>/` 下本次同步会被删除的 legacy 目录

不纳入阻塞检查的路径：

- 仓库其他目录中的改动，例如 `package.json`、锁文件、应用源码
- `<root>/` 根下会被原样保留的 passthrough 普通文件

之所以不直接使用“整个 `<root>/` 目录必须干净”的更粗规则，是因为当前实现不会主动改写 passthrough 文件；若这些文件变脏也阻塞 `sync`，会产生额外误报。

**Alternatives considered**

- 检查整个 `<root>/`：比全仓库检查更合理，但仍会误伤不受 `sync` 管理的根级文件。
- 完全不检查路径级改动：会增加覆盖用户局部改动的风险。

### 3. Git 校验应基于 sync 计划而不是静态目录名

CLI 在执行 staging 之前，先根据当前 Raven root 的状态计算本次操作会触碰的路径集合，再用 Git 仅检查这些 pathspec。这样可以同时覆盖三类风险：

- `raven.yaml` 被用户修改
- `core` 目录下存在未提交修改或新增残留文件
- legacy 目录将被删除，但其中含有未提交改动

这一定义与 `sync` 的真实行为一致，因为 `sync` 最终会以重建后的 staging root 替换 live root。

**Alternatives considered**

- 手写固定目录白名单：容易与未来受管路径集合漂移。
- 只检查 manifest 中存在的 core 文件：无法覆盖 `core/` 下的历史残留文件删除场景。

### 4. `raven-update` 的 clean baseline 只在升级开始前判定一次

`raven-update` 仍然要求在步骤 1 之前验证整个仓库干净，但这个判定不应在 CLI 升级完成后重新执行。升级 CLI 导致的 `package.json` / 锁文件变更属于本次升级 diff 的一部分，skill 应继续执行 `bunx raven sync`，而不是要求用户再次清理工作区。

这使 skill 的责任更清晰：

- 开始前保证基线清晰
- 中途允许升级自身产生 diff
- 结束后统一分析本次升级的完整 diff

**Alternatives considered**

- 在 `bun add` 之后再次要求整个仓库恢复干净：会重新引入当前死锁。
- 让 skill 自动提交一次中间版本：会把一次逻辑升级拆成多个提交，增加用户心智负担。

## Risks / Trade-offs

- [Risk] 路径级 Git 检查比全仓库检查更复杂，容易遗漏某类被 `sync` 删除的路径。  
  Mitigation：测试覆盖 `raven.yaml`、`core/**`、legacy 目录、仓库外部无关改动、`<root>/` 内 passthrough 文件五类场景。

- [Risk] 用户可能误以为 `sync` 会保护 `<root>/` 下所有文件，而不仅是受管路径。  
  Mitigation：在 CLI README、根 README 与错误文案中明确说明 `sync` 只校验并管理受管 Raven 资产。

- [Risk] 自定义 `--root` 若指向 Git 工作区外路径，path-scoped Git 检查语义会变得模糊。  
  Mitigation：本次不扩展该语义；延续当前“命令在当前 Git 工作区中执行”的约束，并在实现时沿用现有错误处理。

## Migration Plan

1. 更新 `cli-tool` 与 `raven-update-skill` 规格，明确两层 cleanliness 语义。
2. 调整 `raven sync` 的实现：在 staging 前计算受管路径集合并执行路径级 Git 检查。
3. 更新 `raven-update` skill 文案与 README，修正升级步骤说明。
4. 扩充 e2e 测试，验证新边界与失败文案。

## Open Questions

- 暂无。当前方向已经收敛为“`raven-update` 检查全仓库起始基线，`raven sync` 检查受管 Raven 路径”。
