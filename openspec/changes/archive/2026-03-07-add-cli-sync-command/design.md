## Context

当前 `packages/cli/index.ts` 只实现了 `init`、`add` 和 `status`。其中 `add` 直接把内嵌 `dist/source/<module>/` 的文件写入现有模块目录，只会覆盖 registry 中声明的文件，不会清理历史残留文件；如果 registry 已经移除了某个模块，本地目录也没有统一的收敛入口。

这次变更的核心约束有三点：

- CLI 仍然必须离线工作，继续以内嵌 `registry.json` 和 `dist/source/` 为唯一数据源
- `sync` 不能只做增量覆盖，必须把模块目录重建到与 registry 完全一致
- 任一步骤失败后，用户本地 `raven/` 不能停留在半更新状态

## Goals / Non-Goals

**Goals:**

- 提供 `raven sync` 命令，对当前 Raven root 中已安装模块执行一次 registry 对齐
- 让每个目标模块目录都由当前 registry 重新生成，从而自动清除本地残留文件
- 删除本地仍存在、但已从 registry 移除的模块目录
- 在同步过程中补齐当前 `dependsOn` 所需但本地缺失的模块
- 通过 staging + swap + rollback 实现“要么全部成功，要么保持原样”

**Non-Goals:**

- 不引入按模块选择性 sync、指定版本 sync 或远程 registry 支持
- 不处理 `.claude/` 等 AI 资源目录
- 不承诺清理“已不再被依赖但仍然存在于本地”的历史模块；本次只保证已安装模块内容精确对齐，以及 registry 已删除模块被移除

## Decisions

### 1. 以当前已安装模块目录作为 sync 种子集合

`sync` 启动时读取 `<root>/` 下的一级子目录，将其视为当前已安装的 Raven 模块。存在于 registry 的目录进入 `knownModules`，不存在于 registry 的目录进入 `removedModules`。

随后，CLI 基于 `knownModules` 按当前 registry 的 `dependsOn` 计算依赖闭包，得到 `desiredModules`。这样可以保证：

- 已安装模块会被同步到最新 registry 结构
- 某个已安装模块如果新增了 `dependsOn`，sync 可以补齐缺失依赖
- 某个本地模块如果已从 registry 删除，会被显式移除

**Alternatives considered**

- 仅同步当前 registry 仍认识的模块目录：无法识别并删除已被 registry 移除的本地模块
- 引入新的模块清单元数据文件：语义更精细，但会扩大变更面；当前目录结构已经足够表达“已安装模块集合”

### 2. 不做原地修改，而是在临时 root 中重建目标状态

CLI 将在 Raven root 的同级目录创建 staging 目录，例如 `<parent>/.raven-sync-<random>/`，并在其中构建“同步完成后应该存在的完整 root”：

- 重新生成 `raven.yaml`，将 `version` 更新为当前 registry 版本，并保留已有 `language`
- 对 `desiredModules` 中的每个模块调用现有复制逻辑，从内嵌 `dist/source/` 重新写入 staging
- 不把旧模块目录复制进 staging，因此 registry 之外的历史残留文件会自然消失
- 对 root 下的非模块文件按需原样带入 staging，避免误删与模块无关的顶层文件

**Alternatives considered**

- 原地先删后写：任何中途失败都会把 live tree 留在不完整状态
- 按模块逐个临时目录替换：单模块可回滚，但无法保证整个 root 的一致性

### 3. 用目录级 swap 实现提交，并在失败时回滚

当 staging 完整构建成功后，CLI 执行两段式提交：

1. 将当前 `<root>/` 重命名为 backup 目录
2. 将 staging 目录重命名为正式 `<root>/`

如果第二步失败，CLI 立即把 backup 重命名回 `<root>/`。只有两步都成功后才删除 backup。

为了让重命名保持在同一文件系统内，staging 和 backup 都创建在 `<root>` 的父目录下。这不能提供跨进程可见性的“单 sys-call 原子事务”，但可以保证命令结束后只有两种结果：新 root 全部生效，或旧 root 被完整恢复。

**Alternatives considered**

- 直接覆盖现有 root：不能满足“全部成功或保持原样”
- 为每个文件做 hash 校验后差量更新：实现复杂，且仍然无法天然删除残留文件

### 4. `sync` 复用现有安装路径改写与 Agent 输出模型

模块文件内容仍复用 `installModule`/`replaceRavenImports` 的路径改写逻辑，避免 `add` 与 `sync` 生成不同代码。

命令输出沿用当前 Agent-first CLI 风格：成功时先输出一条 JSON 摘要（如同步模块、删除模块、修改文件），再输出一次 `raven status` JSON，方便 agent 在一次调用中拿到结果和最终状态。

## Risks / Trade-offs

- [Risk] `sync` 需要把 `<root>/` 下的一级目录视为 CLI 管理的模块目录，若用户在该目录手工放入其他目录，可能被识别为“已移除模块”并删除 → Mitigation：在 README 和命令帮助中明确 `<root>/` 的一级目录为 Raven 模块保留空间；仅透传非模块顶层文件
- [Risk] staging 与 backup 需要额外磁盘空间，模块较多时同步峰值空间接近双份 → Mitigation：同步完成后立即清理 staging/backup，并把该成本限制在命令执行窗口内
- [Risk] 重命名回滚依赖同一文件系统语义，异常环境下仍可能出现提交失败 → Mitigation：staging 与 backup 固定创建在 `<root>` 同级目录，避免跨卷移动

## Migration Plan

1. 在 CLI 中新增 `cmdSync` 和若干 root staging helper，不改变现有 `init`/`status` 命令接口
2. 抽出“列举已安装模块”“构建目标模块集合”“构建 staging root”“提交/回滚”四层 helper，减少与 `add` 的耦合
3. 增加 e2e 测试，覆盖残留文件清理、registry 删除模块、补齐新增依赖和失败回滚
4. 更新 `packages/cli/README.md` 与 `--help` 文案，说明 `sync` 与 `add` 的区别

## Open Questions

- 暂无。当前方案已经覆盖删除残留文件、删除 registry 已移除模块和整体回滚三个核心诉求。
