## Context

当前仓库的真实更新能力来自两部分代码，而不是旧版 spec：

- `packages/cli/index.ts` 只实现了 `init`、`add`、`sync`、`status` 四个命令；其中 `sync` 已经具备“重建模块目录 + staging + rollback”的原子同步能力。
- `packages/install-raven/skills/` 目前只有 `raven-setup`、`raven-add`、`raven-learn`、`raven-use` 四个 skill，没有专门负责“升级 CLI + 同步 raven 代码 + 适配 breaking change”的 update skill。

README 目前把升级流程写成了手工步骤：用户自己执行 `bun add -d @raven.js/cli@latest`，然后再决定是否运行 `bunx raven sync`。这意味着 Agent 没有统一、可复用、可约束的更新工作流。更关键的是，`sync` 虽然已经具备原子写入，但它当前不校验 Git 状态；如果在脏工作区执行，同步后的 diff 会与用户本地未提交改动混在一起，Agent 很难可靠地区分“框架升级带来的变化”和“用户原本就在编辑的变化”。

另一个现实约束是：当前代码里没有 `raven update` 或 `raven diff` 命令，因此这次设计不能建立在这些历史命令之上，而必须围绕现有的 `bun add -d @raven.js/cli@latest`、`bunx raven sync` 和 Git diff 来组织。

同时，仓库里仍有一批围绕旧更新模型留下的规范和代码残留：例如 `agent-focused-cli` / `smart-code-update` 仍要求 `raven status` 提供 `latest version`、`file hashes` 或依赖不存在的 `raven diff` / `raven guide`；而 `packages/cli/index.ts` 的 `getStatus()` 也还保留了 `modifiedFiles`、`fileHashes` 和整棵 `raven/` 遍历 hashing 逻辑。这些内容已经不符合当前代码与未来流程，需要直接清理，而不是兼容保留。

## Goals / Non-Goals

**Goals:**

- 新增 `raven-update` skill，为 Agent 提供唯一、明确、可重复执行的 RavenJS 更新入口。
- 在 skill 中串起 Bun 依赖升级、`bunx raven sync`、diff 分析、breaking change 适配和结果汇报。
- 在 CLI 层强制 `raven sync` 只能在干净的 Git 工作区内执行，避免危险操作仅靠 skill 文档约束。
- 更新 README 与 skill 分发内容，使用户和 Agent 都能发现这条推荐更新路径。
- 清理旧更新模型留下的过时规范与无用 CLI 代码，尤其是 `raven status` 的 diff/hash 类输出。

**Non-Goals:**

- 不新增新的 `raven update`、`raven diff` 或 `self-update` CLI 命令。
- 不让 CLI 自动分析 breaking changes；变更语义理解仍由 Agent 基于 diff 和文档完成。
- 不让 skill 自动帮用户 stash、commit 或创建 Git 仓库；这类可逆性策略保持由用户决定。
- 不改变 `install-raven` 的安装机制；skill 仍通过现有“扫描 `skills/` 子目录并复制”的机制分发。
- 不为旧的 `raven status` 字段或旧规范提供兼容层；无用字段可以直接删除。

## Decisions

### 1. 新增独立的 `raven-update` skill，而不是扩展现有 skill

`raven-update` 会作为新的 skill 目录加入 `packages/install-raven/skills/`，由 `install-raven` 现有的动态扫描逻辑自动发现并复制。这样可以保持 skill 职责清晰：

- `raven-setup` 负责初始化和环境修复
- `raven-add` 负责装模块
- `raven-learn` 负责学习文档
- `raven-use` 负责写业务代码
- `raven-update` 负责升级 CLI、同步 Raven 框架代码、分析升级影响并完成兼容性修复

**Alternatives considered**

- 扩展 `raven-setup`：会把“首次安装”和“后续升级”混在一起，前置条件和输出目标不同。
- 扩展 `raven-use`：更新流程不是普通业务开发任务，安全约束也更强，不适合混入日常编码 skill。

### 2. 更新流程基于当前真实命令集合：`bun add` + `bunx raven sync` + `git diff`

skill 采用下面的顺序：

1. 校验 Bun 可用。
2. 校验当前目录位于 Git 工作区，且 `git status --porcelain` 为空。
3. 运行 `bun add -d @raven.js/cli@latest` 升级项目本地 CLI。
4. 运行 `bunx raven sync` 重建本地 `raven/`。
5. 使用 Git diff 分析同步前后的变化，重点查看：
   - `git diff -- raven/`：框架代码本身发生了什么变化
   - 项目代码对 Raven 模块的引用点：哪些调用、导入、配置可能受影响
6. 当 diff 显示 breaking changes 时，读取更新后的模块文档（尤其是受影响模块的 `GUIDE.md` / `README.md` / pattern 文档），然后修改用户项目代码做适配。

这条路径完全建立在当前仓库已实现的命令之上，不依赖历史上出现过但已不存在的 `raven update` 或 `raven diff`。

**Alternatives considered**

- 新增一个 CLI `update` 命令统一处理：会扩大变更面，把本应由 Agent 做的语义分析重新塞回 CLI。
- 继续依赖 README 的手工步骤：无法形成标准 skill，也无法稳定复用。
- 依赖不存在的 `raven diff` 命令：与当前代码事实不符。

### 3. Git 安全检查采用“双层防线”：skill 预检查 + CLI 强制检查

仅在 skill 中要求“先看 Git 状态”是不够的，因为用户或其他自动化仍然可以直接运行 `bunx raven sync`。因此需要两层约束：

- **Skill 层**：在执行任何升级命令前先检查 Git 工作区，给用户明确的操作建议。
- **CLI 层**：在 `cmdSync` 开始时执行 Git 校验；若不在 Git 工作区、Git 不可用、或工作区不干净，立即报错退出，并且在进入 staging 之前结束。

CLI 层检查的价值在于：即便用户绕过 skill 直接运行命令，也不会在不可区分 diff 的状态下重建 `raven/`。同时，由于当前 `sync` 已经具备 staging/rollback 机制，新增校验只需要保证“失败时发生在任何文件写入之前”。

**Alternatives considered**

- 只在 skill 中检查：CLI 仍然可以被手动误用。
- CLI 自动 stash 再恢复：会引入额外隐式状态，且在冲突或恢复失败时更难理解。
- 仅检查 tracked 改动、不检查 untracked 文件：无法保证 Git diff 基线真的干净。

### 4. Breaking change 适配由 skill 负责完成，而不是只做提示

用户明确要求“如果有 breakchange，则需要帮用户修改代码进行适配”。因此 `raven-update` 不能停留在“发现破坏性更新后给出报告”；它必须继续做两件事：

- 定位受影响的项目代码入口，例如导入路径、配置对象、框架 API 调用、pattern 边界相关文件。
- 按更新后的 Raven 文档与代码实际变化修改用户项目代码，并在结束前说明哪些兼容性修复是因升级而引入的。

skill 不需要承诺“自动理解所有 breaking changes”，但至少要要求 Agent 基于真实 diff 和最新文档完成一次有依据的适配，而不是凭旧知识猜测。

**Alternatives considered**

- 仅输出 breaking change 报告：不满足用户要求，也无法形成完整升级工作流。
- 让 CLI 生成 breaking change 摘要：需要额外的语义分析机制，超出本次范围。

### 5. 文档与分发更新保持最小实现面

`install-raven` 当前通过扫描 `skills/` 子目录自动发现 skill 名称，因此新增 `packages/install-raven/skills/raven-update/SKILL.md` 即可纳入默认分发，不需要改 installer 主逻辑。实现层面只需补充：

- 根 README 的 skill 列表和 Updating 章节
- `packages/cli/README.md` 中对推荐更新入口和 `sync` 安全前置条件的说明

**Alternatives considered**

- 修改 installer 的技能清单配置：当前动态发现已足够，没有必要增加维护点。

### 6. 直接删除过时的 Agent 状态字段和相关规范，不做兼容

当前 `raven status` 的真实消费者只需要知道：

- 当前 Raven 版本
- 交互语言
- 模块列表及其安装状态 / 安装目录

`modifiedFiles`、`fileHashes`、`latest version`、`raven diff`、`raven guide` 这类字段或命令要求并没有在当前 CLI 实现中形成稳定闭环，反而让规范与代码长期背离。因此本次直接执行“删旧立新”：

- 从 CLI 代码中删除 `StatusResult.modifiedFiles`、`StatusResult.fileHashes`、`computeFileHash()` 和相关目录遍历逻辑
- 在 active change 的 delta specs 中把 `agent-focused-cli`、`smart-code-update`、`cli-tool` 收敛到当前真实更新流程
- 不保留兼容字段，也不为已有调用方做 dual-write

**Alternatives considered**

- 保留字段但标记 deprecated：会延长不一致状态，且当前仓库没有证据表明这些字段被有效消费。
- 新增真正的 `raven diff` / `guide` 命令来补齐旧 spec：这会把范围重新扩散到用户没有要求的方向。

## Risks / Trade-offs

- [Risk] 强制要求 Git 工作区会阻止未使用 Git 的项目直接执行 `sync`。  
  Mitigation：在错误文案和 skill 中明确说明原因，并提示用户先初始化 Git 或自行创建可恢复备份。

- [Risk] `raven-update` 依赖 Agent 自行分析 diff，无法像编译器那样保证识别所有语义级 breaking changes。  
  Mitigation：要求 skill 在分析 diff 时同时读取更新后的模块文档，并在存在测试或验证命令时执行最相关的验证。

- [Risk] 升级 CLI 包本身可能修改锁文件或 `package.json`，这会让更新 diff 不再只包含 `raven/`。  
  Mitigation：将 clean worktree 作为前置条件，保证这些变更全部属于本次更新；skill 在报告时单独区分“CLI 依赖变更”“Raven 框架同步变更”“项目适配变更”。

- [Risk] 直接删除 `raven status` 的旧字段会破坏任何依赖这些字段的外部脚本。  
  Mitigation：当前仓库内没有测试或 skill 依赖这些字段，且用户已明确表示不考虑兼容性；因此以简化实现和规范收敛为优先。

## Migration Plan

1. 新增 `raven-update` skill，并在 README 中把它加入推荐技能列表与更新指南。
2. 在 `packages/cli/index.ts` 为 `sync` 增加 Git 校验 helper，并确保失败发生在 staging 前。
3. 删除 `raven status` 的无用 diff/hash 代码路径，并更新相关测试断言。
4. 在 CLI e2e 测试中补齐“非 Git 工作区失败”和“脏 Git 工作区失败”场景，同时保留现有 clean worktree 场景。
5. 更新 `packages/cli/README.md`，明确 `sync` 只在干净 Git 工作区执行，以及推荐通过 `raven-update` skill 触发更新流程。

## Open Questions

- 暂无。当前范围已经收敛到“新增 skill + 强化 sync 安全前置条件”，不引入新的 CLI 命令或额外自动化状态。
