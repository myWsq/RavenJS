## Why

当前 RavenJS 的“模块系统”已经失去产品必要性。官方可安装能力实际上只剩 `core` 和一个只有极薄封装价值的 `sql` 模块，但仓库结构、CLI、registry、skills 与文档仍要围绕模块发现、模块安装、模块同步和模块学习建立整套机制，增加了 Agent 心智负担与维护成本。

既然 2.0 明确允许破坏性调整，就应该把 RavenJS 收敛为单一的 core reference framework：保留 `core` 内部按概念组织的源码与 pattern 文档，删除“多模块分发”这一层抽象；同时将 `sql` 从官方模块降级为 plugin 示例，继续承担教学价值而不再参与产品分发模型。

## What Changes

- **BREAKING** 移除 RavenJS 的模块系统，不再把 `core` 视为“可安装模块”之一，而是将 RavenJS 定义为单一的 core reference framework。
- **BREAKING** 删除 `raven add <module>` 命令、registry 中的 `modules` / `dependsOn` 语义，以及与模块拓扑安装相关的 CLI 行为。
- **BREAKING** 调整 `raven init`，使其直接初始化并安装唯一的 core 参考代码，而不是仅创建 root 后再要求执行 `raven add core`。
- **BREAKING** 调整 `raven sync` 与 `raven status`，使其面向单一 core 代码树工作，而不是面向已安装模块集合工作。
- **BREAKING** 将 `sql` 从官方模块降级为 plugin 示例资产，不再作为 workspace 模块、CLI 可安装项、registry 条目或独立学习入口。
- 更新 install-raven 与相关 Agent skills，移除“识别模块 / 安装模块 / 学习模块”的工作流分叉，统一为围绕 Raven core 的 setup、learn、use、update 体验。
- 更新 README、GUIDE、示例与相关规范，统一对外叙事为“单一 core + pattern + example plugins”，不再暴露“Available Modules”这一产品概念。

## Capabilities

### New Capabilities

- `plugin-examples`: 定义 RavenJS 提供示例 plugin 资产的约束，至少包含一个 SQL plugin 示例，并明确示例不属于官方可安装模块。

### Modified Capabilities

- `cli-tool`: CLI 从模块安装模型切换为单一 core 安装 / 同步 / 状态模型。
- `cli-embedded-source`: CLI 构建产物从嵌入多模块源码改为嵌入单一 core 参考源码及必要示例资产。
- `agent-focused-cli`: 面向 Agent 的结构化状态输出从 `modules[]` 模型改为单一 core 状态模型。
- `install-raven`: setup 相关技能不再依赖 `raven add core` 或模块识别流程，而是直接围绕唯一 core 完成初始化。
- `raven-update-skill`: 更新工作流改为升级并同步单一 core 代码树，而不是同步模块集合。
- `module-guide-requirement`: 删除“每个 registry 模块都必须提供 GUIDE.md”的前提，改为只对 Raven 核心教学资产和约定保留必要的学习入口要求。

## Impact

- 受影响代码：`packages/cli/**`、`packages/install-raven/**`、`packages/core/**`、`examples/sql-plugin/**`、`README.md`、`package.json`、`scripts/generate-modules-table.ts` 的相关引用与文案。
- 受影响接口：`raven add` 命令移除；`raven init`、`raven sync`、`raven status` 的行为与输出发生破坏性变化。
- 受影响分发：CLI 不再维护多模块 registry / dependsOn 语义；`sql` 不再作为官方模块分发。
- 受影响文档与规范：所有面向 Agent 的 setup / learn / use / update 叙事将统一到“单一 core”模型。
