---
name: raven-learn
description: 让 Agent 学习 ravenjs 的设计哲学和架构。使用当 Agent 需要了解 ravenjs 如何工作时。
license: MIT
compatibility: Requires RavenJS to be installed first.
metadata:
  author: ravenjs
  version: "3.0"
---

# RavenJS Learn Skill

让 Agent 学习 ravenjs 的设计哲学、架构和实现细节。

**何时使用**：
- 用户说"教我 ravenjs"
- Agent 需要理解 ravenjs 的设计意图
- Agent 想要用 ravenjs 的风格写代码
- 首次使用 ravenjs 之前
- 需要学习特定模块时

**不使用时**：
- 用户只是想快速写代码，不需要深入理解
- Agent 已经了解 ravenjs

**Steps**

1. **检查项目状态**：运行 `raven status` 检查是否已安装（输出为 JSON）。解析 JSON，若 core 未安装，先建议使用 raven-install。
2. **确定要学习的模块**：
   - 默认学习 `core` 模块
   - 如果用户指定了特定模块，学习那个模块
3. **获取模块内容**：运行 `raven guide <module-name>` 获取该模块的完整内容（包括 README 和所有源码）。
4. **解析 guide 输出**：
   - `<readme>` 部分：阅读 README，理解 OVERVIEW、HOW TO READ THIS CODE、CORE CONCEPTS、ARCHITECTURE、DESIGN DECISIONS 等章节
   - `<code>` 部分：阅读所有代码文件，重点看 KEY CODE LOCATIONS 标记的部分
5. **总结学习**：向用户简要说明学到的关键点

**Guardrails**
- 优先使用 `raven guide` 命令，而不是直接读取单个文件
- 重点理解"为什么这么设计"，而不只是"代码是什么"
- 如果有不理解的地方，诚实说明，不要编造
- 从 `raven status` 输出获取安装目录信息，不要硬编码路径
- `raven guide` 输出的是分块的 markdown 文本，不是 JSON
- 除了 `raven init` 和 `raven guide` 外，其他命令默认输出 JSON
