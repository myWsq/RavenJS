## Context

当前 `examples/` 目录作为独立目录存在于项目根目录，包含 `sql-plugin` 示例。该目录在之前的变更中从 `modules/sql` 迁移而来，作为教学资产存在。

现状：

- `examples/sql-plugin/` 包含 3 个文件：`index.ts`（示例代码）、`README.md`（说明文档）、`GUIDE.md`（阅读路径）
- 多个文档引用该目录：`packages/core/GUIDE.md`、`packages/core/README.md`、`packages/core/pattern/runtime-assembly.md`、`README.md`、`packages/install-raven/skills/raven-learn/SKILL.md`
- CLI 可能包含安装示例资产的逻辑

## Goals / Non-Goals

**Goals:**

- 删除 `examples/` 物理目录
- 将 SQL plugin 示例代码整合到 `packages/core/pattern/runtime-assembly.md` 文档中
- 更新所有引用 `examples/` 路径的文档
- 移除 CLI 中与示例安装相关的代码（如果存在）

**Non-Goals:**

- 不改变示例代码的内容和教学价值
- 不影响 plugin 系统的实现
- 不涉及其他文档的重构

## Decisions

### 决策 1：示例代码嵌入位置

**选择**：将 SQL plugin 示例代码嵌入到 `packages/core/pattern/runtime-assembly.md`

**理由**：

- `runtime-assembly.md` 已经讨论 plugin、state、runtime 组装模式
- 该文档已有对 `examples/sql-plugin/index.ts` 的引用
- 示例代码与文档主题高度相关

**替代方案**：

- 嵌入到 `packages/core/PLUGIN.md`：但该文档更偏向 API 参考，不如 pattern 文档适合完整示例
- 嵌入到 `packages/core/README.md`：会使 README 过长

### 决策 2：文档更新策略

**选择**：将所有 `<raven_root>/examples/sql-plugin/` 引用替换为文档内引用

**理由**：

- 示例代码将直接在 `runtime-assembly.md` 中展示
- 其他文档可以引用该文档的相应章节
- 保持文档间的链接关系

## Risks / Trade-offs

**[风险] 示例代码可能在文档中不如独立文件易于维护** → 通过在 `runtime-assembly.md` 中使用清晰的代码块和注释来缓解

**[风险] CLI 可能包含安装示例的逻辑，需要仔细检查** → 在实施阶段搜索相关代码并移除

**[权衡] 失去独立文件的可复制性** → 用户仍可从文档中复制代码，且文档中的示例更易于理解上下文

## Migration Plan

1. 将 `examples/sql-plugin/index.ts` 的代码嵌入到 `packages/core/pattern/runtime-assembly.md`
2. 更新所有引用 `examples/` 的文档
3. 检查并移除 CLI 中与示例安装相关的代码
4. 删除 `examples/` 目录
5. 验证所有文档链接正常
