---
name: raven-install
description: 在当前项目中安装 RavenJS 框架。使用当用户想要开始使用 RavenJS 构建 Web 应用时。
license: MIT
compatibility: Requires Bun or Node.js runtime.
metadata:
  author: ravenjs
  version: "1.0"
---

# RavenJS Install Skill

在当前项目中安装并初始化 RavenJS 框架。

**何时使用**：
- 用户说"我想使用 RavenJS"
- 用户说"安装 RavenJS"
- 用户说"初始化一个 RavenJS 项目"
- 用户想要创建一个新的 Web 服务

**不使用时**：
- 项目已经初始化过 RavenJS：先运行 `raven status` 或 `raven status --json` 检查 core/modules 安装状态，若 core 已安装则跳过
- 用户只是想问问题，不想实际安装

**Steps**

1. **检查项目状态**：运行 `raven status` 或 `raven status --json` 获取安装状态。若 core 已安装，提示用户并询问是否要重新安装或继续。
2. **确认安装**：如果未安装，使用 **AskUserQuestion** 确认（"即将在当前目录安装 RavenJS。是否继续？"）。
3. **执行安装**：运行 `raven install`。
4. **验证安装**：检查是否生成了 `raven/` 目录，并列出安装的内容。
5. **下一步建议**：告诉用户可使用 raven add 添加模块，或直接开始编写代码。

**Guardrails**
- 不要覆盖已有的 raven/ 目录，除非用户明确确认
- 如果 raven 命令不可用，提示用户先安装 RavenJS CLI
