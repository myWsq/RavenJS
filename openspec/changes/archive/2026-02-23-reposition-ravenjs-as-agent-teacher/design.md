## Context

ravenjs 当前是一个传统的 npm 框架，用户通过 `npm install` 安装依赖，然后 import 使用。在 AI 时代，这种模式不够理想，因为 Agent 需要理解框架的设计哲学才能更好地帮助用户开发。

**当前状态**：
- 框架代码作为 npm 包发布
- CLI 输出面向人类（彩色、进度条）
- README.md 同时给人和 Agent 看

**约束条件**：
- 保持代码简洁，不要引入新文件（仅保留 README.md）
- 避免手动维护变更历史（Changelog 维护成本太高）
- 优先面向 Agent，不考虑人类用户体验

## Goals / Non-Goals

**Goals:**
- 重新定位 ravenjs 为 Agent 的教学工具，而非用户的框架
- 提供初始代码 + 教学内容，让 Agent 学会如何写代码
- 设计 Agent 优先的 CLI，输出全部为 JSON 格式
- 支持两种更新模式：未修改直接覆盖，已修改智能合并
- 保持实现简单，避免过度设计

**Non-Goals:**
- 不维护 Changelog（变更历史）
- 不考虑人类用户的 CLI 体验（除了 raven init）
- 不提供 pre-computed 的变更分析（让 Agent 自己分析）

## Decisions

### 1. SKILL 体系设计
**决定**：使用 4 个核心 SKILL
- `raven-learn` - Agent 学习 ravenjs 设计哲学
- `raven-install` - 安装初始代码到用户项目
- `raven-check-update` - 检查是否有更新
- `raven-merge` - 更新代码（处理两种情况）

**替代方案考虑**：
- 方案 A：更多细分 SKILL（如 raven-update-code、raven-merge 分开）→  rejected，过于复杂
- 方案 B：更少 SKILL，合并功能 → rejected，职责不够清晰

**理由**：4 个 SKILL 覆盖了完整的生命周期，职责清晰，不会太复杂。

---

### 2. CLI 输出格式
**决定**：所有命令输出 JSON 格式，仅 `raven init` 例外（给人类用）

**替代方案考虑**：
- 方案 A：混合输出（有的 JSON，有的人类可读）→ rejected，一致性差
- 方案 B：全部人类可读，加 --json 选项 → rejected，Agent 需要每次都加选项

**理由**：Agent 是主要使用者，JSON 格式结构化，易于解析。

---

### 3. 参考代码文档结构
**决定**：仅保留 README.md，不新增其他文件

**替代方案考虑**：
- 方案 A：多个文件（DESIGN.md、CHANGELOG.md、TEACHING.md）→ rejected，维护成本高
- 方案 B：仅保留 README.md，但内容拆分 → accepted

**理由**：减少文件数量，降低维护成本。README.md 结构面向 Agent，包含：
- OVERVIEW
- HOW TO READ THIS CODE
- CORE CONCEPTS
- ARCHITECTURE
- DESIGN DECISIONS
- KEY CODE LOCATIONS
- EXTENSION POINTS
- USAGE EXAMPLES

---

### 4. 更新工作流设计
**决定**：不提供 pre-computed 的变更分析，让 Agent 自己分析

**替代方案考虑**：
- 方案 A：从 metadata.json 读取变更 → rejected，需要手动维护
- 方案 B：从 git history 提取 → rejected，复杂且不可靠
- 方案 C：让 Agent 自己分析 → accepted

**理由**：完全自动化，无需手动维护。`raven guide` 只提供基础上下文，具体分析由 Agent 完成。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Agent 可能无法正确理解 README.md 的教学内容 | 保持文档结构清晰，语言直接，像给同事解释一样 |
| 智能合并可能出错 | 让 Agent 谨慎处理，不确定时询问用户 |
| 没有人类友好的 CLI 输出 | 仅 `raven init` 给人类用，其他由 Agent 调用 |
| 没有 Changelog 可能难以追踪变更 | 依赖 git history 和 Agent 的分析能力 |
