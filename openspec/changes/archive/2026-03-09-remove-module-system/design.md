## Context

当前 RavenJS 的产品形态仍建立在“多模块分发”上：仓库有 `modules/*` 工作区，CLI 通过 registry 枚举模块、解析 `dependsOn`、执行 `raven add` / `raven sync`，skills 也围绕“先识别模块、再安装模块、再学习模块”设计。但从实际内容看，官方可安装能力已经几乎完全收敛到 `core`；`sql` 只是一个极薄的 plugin 封装，而且 `core` 的 pattern 文档已经在教授用户如何自己写同类 database plugin。

这意味着模块系统带来的额外复杂度已经大于其收益。2.0 的目标不是继续维护“只剩一个模块的模块系统”，而是删除多模块分发抽象，保留真正有价值的部分：`core` 的源码组织、pattern 文档、离线安装/同步能力，以及 Agent-first 的学习体验。

## Goals / Non-Goals

**Goals:**

- 将 RavenJS 的分发与安装模型收敛为“单一 core reference framework”。
- 保留 `@raven.js/core` 的学习入口、导入契约和现有 pattern 文档价值。
- 保留离线安装与 `raven sync` 的更新体验，但不再依赖模块 registry / dependsOn。
- 将 `sql` 转换为教学型 plugin 示例，而不是官方可安装模块。
- 将仓库内原有 `modules/core` 迁移到 `packages/core`，并移除 `modules/` 目录。
- 简化 Agent skills，使 setup / learn / use / update 全部围绕唯一 core 展开。

**Non-Goals:**

- 不在本次变更中重设计 `core` 的运行时 API、plugin API 或 pattern 边界。
- 不把 RavenJS 改回 npm 依赖式框架；项目内复制参考代码的模型保持不变。
- 不在本次变更中引入通用示例市场或复杂的示例发现机制；先落地 SQL plugin 示例即可。
- 不在本次变更中扩大为更广泛的 monorepo 重构；仅完成 `modules/core -> packages/core` 与 `modules/sql -> examples/sql-plugin` 的必要迁移。

## Decisions

### 1. 分发模型改为“单一 core + 示例资产”，不再存在可安装模块集合

CLI 不再维护 `modules` 列表、`dependsOn` 拓扑或 `raven add` 工作流。仓库内的 core 源码放在 `packages/core/`，但 `raven init` 仍直接在 Raven root 下安装唯一受管理的 `<root>/core/` 代码树，并按需安装受管理的示例资产；`raven sync` 则对齐这组固定资产。

保留 `<root>/core/` 作为安装目录，而不是把 core 直接平铺到 `<root>/`。这样可以继续保持 `@raven.js/core` 的导入契约与当前 tsconfig 映射方式，避免为了移除模块系统而额外引入一次全面 import 迁移。

考虑过的替代方案：

- 直接把 core 平铺到 `<root>/`：抽象最干净，但会同时打破导入路径、学习文档和现有项目结构，迁移面过大。
- 保留 `raven add core`，只是删除其它模块：用户心智上仍然是在使用“模块系统”，没有真正去掉抽象层。

### 2. 用固定受管理资产替代 registry 模块语义

构建产物仍然保留“离线嵌入源码”的能力，但嵌入内容不再围绕 registry modules 组织，而是围绕固定受管理资产组织：至少包括 `core`，以及本次引入的 plugin 示例目录。CLI 只需要知道哪些目录由 Raven 管理，不再需要描述模块依赖关系。

这允许保留现有“从 dist 内嵌源码复制到用户项目”的离线特性，同时删除 `dependsOn`、模块遍历、模块状态枚举和 import rewrite 中针对多模块的复杂逻辑。

考虑过的替代方案：

- 继续保留 `registry.json` 但只放一个 `core` 模块：实现改动较小，但会把已经失效的产品概念继续暴露到实现、测试与文档中。
- 完全取消嵌入源码，改为运行时直接读仓库文件或远程下载：会损失离线可用性，也不符合当前 CLI 的核心价值。

### 3. `raven status` 改为单一 core 状态模型

`raven status` 的结构化输出改为描述唯一 core 安装状态，而不是返回 `modules[]`。推荐输出至少包含：

- `version`
- `language`
- `installed`
- `rootDir`
- `installDir`

这样 setup / learn / use / update 技能都不再需要先从模块数组中筛选 `core`，也不需要猜测哪些模块需要添加。

考虑过的替代方案：

- 输出顶层 `core: { installed, installDir }`：也可行，但对只有单一安装对象的系统来说多了一层无效包装。
- 保留 `modules[]` 但数组永远只有一个 `core`：对 Agent 来说仍是误导性的多模块协议。

### 4. `sql` 迁移为受管理的教学示例，而不是官方能力模块

`sql` 不再作为 workspace 模块、CLI 可安装项或独立 GUIDE 入口存在。它会转为一个明确的 plugin 示例资产，仓库源码位于 `examples/sql-plugin/`，安装后位于 `<root>/examples/sql-plugin/`，并由 core 的 GUIDE / README / pattern 文档链接过去，作为“如何写 database plugin”的官方参考。

这样既保留了现有 SQL 示例的教学价值，又避免继续暗示“官方能力通过模块安装扩展”的产品方向。

考虑过的替代方案：

- 直接删除 `sql` 而不保留示例：会损失一个非常贴近实际需求的 plugin 编写样例。
- 继续把 `sql` 放在 `modules/sql`，但不对外宣传：实现上仍会拖住 workspace、CLI 构建与文档边界。

### 5. skills 收敛为 core-only 工作流

默认分发的 Raven skills 应围绕单一 core 工作流组织：

- `raven-setup`
- `raven-learn`
- `raven-use`
- `raven-update`

`raven-add` 从默认分发中移除。`raven-setup` 负责安装 CLI、执行 `raven init`、完成配置检查；`raven-learn` 与 `raven-use` 直接学习/使用 core；`raven-update` 分析的 diff 重点从“模块集合变化”改为 `raven/core` 与示例资产变化。

## Risks / Trade-offs

- [保留 `<root>/core/` 目录会留下“像模块”的视觉残影] → 通过移除 `add`、`modules[]`、`Available Modules` 和 registry 语义来消除真正的模块心智；目录名仅作为兼容现有 import 契约的实现细节。
- [CLI 与 skills 的协议会发生破坏性变化] → 在 specs 中明确新的 `status` 输出与 setup/update 工作流；依赖 `raven-update` 与 clean Git diff 做迁移适配。
- [旧项目可能残留 `raven/sql/` 等历史目录] → `raven sync` 将这些目录视为遗留模块并在重建受管理资产时清理；同步过程保持原有原子性和 Git 安全门槛。
- [示例资产被复制进每个项目会增加一些噪音] → 示例目录保持轻量，并在 README/GUIDE 中明确其角色是“可学习、可删除的参考资产”，不是运行时必需目录。

## Migration Plan

1. 新项目工作流改为：`install-raven` → `raven-setup` → `raven init` → 开始使用 Raven core。
2. 现有项目升级时，通过新版 `raven-update` 先升级 CLI，再执行 `raven sync`，由同步过程重建 `<root>/core/` 和受管理示例目录，并清理 `sql/` 等遗留模块目录。
3. 因为保留 `@raven.js/core` 导入契约与 `<root>/core/` 目录，用户项目通常不需要因为 2.0 专门修改 core import 路径。
4. 若同步结果不符合预期，用户可依赖 `raven sync` 的原子回滚与 Git 干净工作区约束安全退出，并通过 Git diff 分析改动。

## Open Questions

None.
