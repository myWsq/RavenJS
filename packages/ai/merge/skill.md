---
name: raven-merge
description: 更新用户项目中的 ravenjs 代码（支持两种模式：直接覆盖或智能合并）。使用当用户想要更新 ravenjs 代码时。
license: MIT
compatibility: Requires RavenJS to be installed first.
metadata:
  author: ravenjs
  version: "2.0"
---

# RavenJS Merge Skill

更新用户项目中的 ravenjs 代码，支持两种模式：
1. 用户未修改过 → 直接覆盖
2. 用户修改过 → 智能合并

**何时使用**：
- 用户说"更新 ravenjs"
- 用户说"升级 ravenjs"
- 检查到有新版本且用户想要更新

**不使用时**：
- 项目还未安装 RavenJS
- 用户不想更新
- 不确定是否有更新（先使用 raven-check-update）

**Steps**

1. **检查项目状态**：运行 `raven status` 检查安装状态（输出为 JSON）。解析 JSON，若未安装，先建议使用 raven-install。
2. **获取更新指导**：运行 `raven guide` 获取更新的基础信息和指导（输出为 JSON）。
3. **检查是否修改**：从 status 输出的 fileHashes 和 fetch 输出的 registry 信息判断用户是否修改过 ravenjs 代码，或运行 `raven diff` 检查差异。
4. **选择更新模式**：
   - **未修改**：使用 **AskUserQuestion** 确认"你没有修改过 ravenjs 代码，可以直接覆盖。是否继续？"
   - **已修改**：使用 **AskUserQuestion** 确认"你修改过 ravenjs 代码，需要智能合并。这会保留你的修改，同时应用更新。是否继续？"
5. **执行更新**：
   - **直接覆盖模式**：运行 `raven update`，从输出中验证更新是否成功
   - **智能合并模式**：
     a. 运行 `raven fetch` 获取最新代码和 registry 信息（输出为 JSON）
     b. 运行 `raven diff` 对比差异（输出为 JSON）
     c. 阅读 README.md 理解新版本的设计意图
     d. 理解用户修改的意图
     e. 智能合并新旧代码（保留用户的业务逻辑，应用 ravenjs 的更新）
     f. 运行测试验证合并结果
6. **验证更新**：从 update 命令的 JSON 输出中读取 modifiedFiles，确认代码是否正确更新，运行测试（如果有）。
7. **后续建议**：告诉用户更新已完成。

**Guardrails**
- 必须先检查是否有修改，不要盲目覆盖
- 如果用户修改过，一定要进行智能合并，不能直接覆盖
- 智能合并时，优先保留用户的业务逻辑
- 如果对合并不确定，询问用户
- 更新后一定要验证
- 始终从 CLI 的 JSON 输出中解析信息，不要硬编码路径或模块列表
- 除了 `raven init` 外，所有命令默认输出 JSON
